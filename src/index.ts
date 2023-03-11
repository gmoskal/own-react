type CTextTag = string | number
type CProps<T extends AnyObject> = { children: Array<CElement> } & T

export type CTextElement<T extends CTextTag> = { type: string; props: CProps<{ nodeValue: T }> }
export type CElement<T extends AnyObject = AnyObject> = { type: string; props: CProps<T> } | CTextElement<CTextTag>

const createElement = <T extends AnyObject>(
	type: string,
	props: T = {} as any,
	...children: Array<CElement | CTextTag>
): CElement<T> => ({
	type,
	props: {
		...props,
		children: children.map(child => (typeof child === "object" ? child : createTextElement(child)))
	}
})

const TEXT_ELEMENT = "TEXT_ELEMENT"
const createTextElement = <T extends CTextTag>(text: T): CTextElement<T> => ({
	type: TEXT_ELEMENT,
	props: { nodeValue: text, children: [] }
})

const keys = <T extends AnyObject>(o: T) => Object.keys(o) as any as Array<keyof T>

const createDom = <T extends Pick<Fiber, "type" | "props">>({ type, props }: T) => {
	const node = type === TEXT_ELEMENT ? document.createTextNode("") : document.createElement(type)
	keys(props)
		.filter(key => key !== "children")
		.forEach(name => ((node as any)[name] = props[name]))
	return node
}

type NFiber = Fiber | null
export type Fiber<T extends AnyObject = AnyObject> = {
	props: CProps<T>
	type: string
	dom: HTMLElement | Text | null
	parent: NFiber
	child: NFiber
	sibling: NFiber
}

export const Fiber = ({ type, props }: CElement, parent: NFiber = null): Fiber => ({
	type,
	props,
	parent,
	dom: null,
	child: null,
	sibling: null
})

let nextUnitOfWork: NFiber = null
let rootFiber: NFiber = null

const workLoop = (deadline: IdleDeadline) => {
	for (let pause = false; nextUnitOfWork && !pause; pause = deadline.timeRemaining() < 1)
		nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
	requestIdleCallback(workLoop)
}

export const buildChildren = (fiber: Fiber) => {
	let prev: NFiber = null
	fiber.props.children
		.map(child => Fiber(child, fiber))
		.forEach(current => {
			if (!prev) fiber.child = current
			else prev.sibling = current
			prev = current
		})
}

const performUnitOfWork = (fiber: Fiber): NFiber => {
	if (!fiber.dom) fiber.dom = createDom(fiber)
	if (fiber.parent) fiber.parent.dom?.appendChild(fiber.dom)

	buildChildren(fiber)

	if (fiber.child) return fiber.child

	for (let f: NFiber = fiber; f; f = f.parent) if (f.sibling) return f.sibling

	return null
}
const render = (element: CElement, dom: HTMLElement) => {
	rootFiber = {
		dom,
		props: { children: [element] },
		parent: null,
		child: null,
		sibling: null,
		type: "ROOT"
	}
	nextUnitOfWork = rootFiber
}
const init = () => requestIdleCallback(workLoop)
const blockingRender = ({ type, props }: CElement, dest: HTMLElement) => {
	const node = createDom({ type, props })
	if (type !== TEXT_ELEMENT) props.children.forEach(child => blockingRender(child, node as HTMLElement))
	dest.appendChild(node)
}
export const CReact = { createElement, render, blockingRender, init }
