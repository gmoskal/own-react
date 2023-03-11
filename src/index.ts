export const keys = <T extends AnyObject>(o: T) => Object.keys(o) as any as Array<keyof T>

type CTextTag = string | number
type CProps<T extends AnyObject> = { children: Array<CElement> } & T
type CTextElement<T extends CTextTag> = { type: string; props: CProps<{ nodeValue: T }> }
type CElement<T extends AnyObject = AnyObject> = { type: string; props: CProps<T> } | CTextElement<CTextTag>

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

const createDom = <T extends Pick<Fiber, "type" | "props">>({ type, props }: T) => {
	const node = type === TEXT_ELEMENT ? document.createTextNode("") : document.createElement(type)
	keys(props)
		.filter(key => key !== "children")
		.forEach(name => ((node as any)[name] = props[name]))
	return node
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

const mkFiber = ({ type, props }: CElement, delta: Partial<Fiber> = {}): Fiber => ({
	type,
	props,
	parent: null,
	dom: null,
	child: null,
	sibling: null,
	...delta
})

let rootFiber: NFiber = null
let nextFiber: NFiber = null

// for testing purposes
let _requestIdleCallback: typeof requestIdleCallback
const init = (requestIdleCb?: typeof requestIdleCallback) => {
	_requestIdleCallback = requestIdleCb || requestIdleCallback
	_requestIdleCallback(workLoop)
}

const buildFibers = (fiber: NFiber, t: IdleDeadline) => {
	while (fiber) {
		if (t.timeRemaining() < 1) return fiber
		fiber = buildFiber(fiber)
	}
	return null
}

const workLoop = (deadline: IdleDeadline) => {
	nextFiber = buildFibers(nextFiber, deadline)

	if (!nextFiber && rootFiber) {
		commit(rootFiber.child)
		rootFiber = null
	}

	_requestIdleCallback(workLoop)
}

const buildFiber = (fiber: NFiber): NFiber => {
	if (!fiber) return null
	if (!fiber.dom) fiber.dom = createDom(fiber)

	buildFiberChildren(fiber)

	if (fiber.child) return fiber.child
	for (; fiber; fiber = fiber.parent) if (fiber.sibling) return fiber.sibling
	return null
}

const buildFiberChildren = (fiber: Fiber) => {
	let prev: NFiber = null
	fiber.props.children
		.map(child => mkFiber(child, { parent: fiber }))
		.forEach(child => {
			if (!prev) fiber.child = child
			else prev.sibling = child
			prev = child
		})
}

const render = (element: CElement, dom: HTMLElement) => {
	if (!_requestIdleCallback) init()
	rootFiber = mkFiber({ type: "ROOT", props: { children: [element] } }, { dom })
	nextFiber = rootFiber
}

const commit = (fiber: NFiber) => {
	if (!fiber) return

	const { parent, child, sibling } = fiber
	if (parent && parent.dom && fiber.dom) parent.dom.appendChild(fiber.dom)

	commit(child)
	commit(sibling)
}

export const CReactInternal = { mkFiber, buildFibers, buildFiber, buildFiberChildren }
export const CReact = { createElement, render }
