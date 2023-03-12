export const keys = <T extends AnyObject>(o: T) => Object.keys(o) as any as Array<keyof T>

type CTextTag = string | number
type CProps<T extends AnyObject = AnyObject> = { children: Array<CElement> } & T
type CTextElement<T extends CTextTag> = { type: string; props: CProps<{ nodeValue: T }> }
type CElement<T extends AnyObject = AnyObject> = { type: string; props: CProps<T> } | CTextElement<CTextTag>
type NFiber = Fiber | null
type Key = string | number

export type Fiber<T extends AnyObject = AnyObject> = {
	props: CProps<T>
	type: string
	dom: HTMLElement | Text | null
	parent: NFiber
	child: NFiber
	sibling: NFiber
	alternate?: NFiber
	effectTag?: "Update" | "Add" | "Remove"
}

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
	const dom = type === TEXT_ELEMENT ? document.createTextNode("") : document.createElement(type)
	updateDom(dom, { children: [] }, props)
	return dom
}

const isEvent = (key: Key) => key.toString().startsWith("on")
const isProp = (key: Key) => key !== "children" && !isEvent(key)
const isAdded = (prev: AnyObject, current: AnyObject) => (key: Key) => prev[key] !== current[key]
const isRemoved = (current: AnyObject) => (key: Key) => !(key in current)
const toEventType = (name: Key) => name.toString().toLowerCase().substring(2)

const getPropertiesDiff = (prev: AnyObject, current: AnyObject) => ({
	listeners: {
		removed: keys(prev)
			.filter(isEvent)
			.filter(key => !(key in current) || isAdded(prev, current)(key)),
		added: keys(current).filter(isEvent).filter(isAdded(prev, current))
	},
	props: {
		removed: keys(prev).filter(isProp).filter(isRemoved(current)),
		added: keys(current).filter(isProp).filter(isAdded(prev, current))
	}
})

const updateDom = (dom: Fiber["dom"], prev: AnyObject, current: AnyObject) => {
	if (!dom) return
	const { listeners, props } = getPropertiesDiff(prev, current)
	listeners.removed.forEach(n => dom.removeEventListener(toEventType(n), prev[n] as EventListener))
	listeners.added.forEach(n => dom.addEventListener(toEventType(n), current[n] as EventListener))
	props.removed.filter(n => n in dom).forEach(n => delete (dom as any)[n])
	props.added.forEach(name => ((dom as any)[name] = current[name]))
}

const mkFiber = ({ type, props }: CElement, delta: Partial<Fiber> = {}): Fiber => ({
	type,
	props,
	alternate: null,
	parent: null,
	dom: null,
	child: null,
	sibling: null,
	...delta
})

let currentRootFiber: NFiber = null
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
		unmountedFibers.forEach(commit)
		commit(rootFiber.child)
		currentRootFiber = rootFiber
		rootFiber = null
	}
	_requestIdleCallback(workLoop)
}

const buildFiber = (fiber: NFiber): NFiber => {
	if (!fiber) return null
	if (!fiber.dom) fiber.dom = createDom(fiber)

	reconcileChildren(fiber)

	if (fiber.child) return fiber.child
	for (; fiber; fiber = fiber.parent) if (fiber.sibling) return fiber.sibling
	return null
}

let unmountedFibers: Fiber[] = []

const reconcileChildren = (fiber: Fiber) => {
	let prev: NFiber = null
	let oldFiber = fiber.alternate && fiber.alternate.child
	const { children } = fiber.props
	// TODO: use key property for arrays
	for (let index = 0; index < children.length || oldFiber !== null; index++) {
		const el = children[index]
		let child: NFiber = null
		const sameType = oldFiber && el && el.type === oldFiber.type
		if (sameType)
			child = mkFiber(el, { dom: oldFiber?.dom, parent: fiber, alternate: oldFiber, effectTag: "Update" })

		if (!sameType && el) child = mkFiber(el, { dom: null, parent: fiber, alternate: null, effectTag: "Add" })
		if (!sameType && oldFiber) {
			oldFiber.effectTag = "Remove"
			unmountedFibers.push(oldFiber)
		}
		if (oldFiber) oldFiber = oldFiber.sibling
		if (!prev) fiber.child = child
		else prev.sibling = child
		prev = child
	}
}

const render = (element: CElement, dom: HTMLElement) => {
	if (!_requestIdleCallback) init()
	rootFiber = mkFiber({ type: "ROOT", props: { children: [element] } }, { dom, alternate: currentRootFiber })
	unmountedFibers = []
	nextFiber = rootFiber
}

const commit = (fiber: NFiber) => {
	if (!fiber) return

	const { parent, child, sibling } = fiber
	if (parent && parent.dom && fiber.dom)
		switch (fiber.effectTag) {
			case "Add":
				parent.dom.appendChild(fiber.dom)
				break
			case "Remove":
				parent.dom.removeChild(fiber.dom)
				break
			case "Update":
				updateDom(fiber.dom as any, fiber.alternate?.props || { children: [] }, fiber.props)
				break
		}

	commit(child)
	commit(sibling)
}

export const CReactInternal = { mkFiber, buildFibers, buildFiber, reconcileChildren, updateDom, getPropertiesDiff }
export const CReact = { createElement, render }
