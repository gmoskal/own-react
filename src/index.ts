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

const render = ({ type, props }: CElement, dest: HTMLElement) => {
	const node = type === TEXT_ELEMENT ? document.createTextNode("") : document.createElement(type)
	keys(props)
		.filter(key => key !== "children")
		.forEach(name => ((node as any)[name] = props[name]))
	if (type !== TEXT_ELEMENT) props.children.forEach(child => render(child, node as HTMLElement))
	dest.appendChild(node)
}

type NFiber = Fiber | null
type Fiber<T extends AnyObject = AnyObject> = {
	props: CProps<T>
	type: string
	dom: HTMLElement | Text | null
	parent: NFiber
	child: NFiber
	sibling: NFiber
}

const Fiber = ({ type, props }: CElement, parent: Fiber): Fiber => ({
	type,
	props,
	parent,
	dom: null,
	child: null,
	sibling: null
})

const createDom = (fiber: Fiber) => {
	const dom = fiber.type === TEXT_ELEMENT ? document.createTextNode("") : document.createElement(fiber.type)
	keys(fiber.props)
		.filter(key => key !== "children")
		.forEach(name => ((dom as any)[name] = fiber.props[name]))
	return dom
}

let nextUnitOfWork: NFiber = null

const workLoop = (deadline: IdleDeadline) => {
	for (let pause = false; nextUnitOfWork && !pause; pause = deadline.timeRemaining() < 1)
		nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
	requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

const performUnitOfWork = (fiber: Fiber): NFiber => {
	if (!fiber.dom) fiber.dom = createDom(fiber)
	if (fiber.parent) fiber.parent.dom?.appendChild(fiber.dom)

	const { children } = fiber.props

	for (let prevSibling: NFiber = null, i = 0; i < children.length; i++) {
		const element = children[i]
		const newFiber = Fiber(element, fiber)
		if (i === 0) fiber.child = newFiber
		else if (prevSibling) prevSibling.sibling = newFiber
		prevSibling = newFiber
	}

	if (fiber.child) return fiber.child

	for (let f: NFiber = fiber; f; f = f.parent) if (f.sibling) return f.sibling

	return null
}

export const CReact = { createElement, render }
