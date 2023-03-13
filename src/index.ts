export type CProps<T extends Obj = Obj> = { children?: Array<CElement> } & T

type UseStateHook<T> = [T, F1<F1<T, T> | T, void>]
type CTextTag = string | number
type CTextElement<T extends CTextTag> = { type: string; props: CProps<{ nodeValue: T }> }
type CElement<T extends Obj = Obj> = { type: string; props: CProps<T> } | CTextElement<CTextTag>
type NFiber = Fiber | null
type FnFiber = TypedOmit<Fiber, "type"> & { type: F1<Obj, CElement>; hooks: Array<any> }
type Key = string | number

const TEXT_ELEMENT = "TEXT_ELEMENT"
const WIP_ROOT = "WIP_ROOT"

let currentRoot: NFiber = null
let wipRoot: NFiber = null
let nextUnitOfWork: NFiber = null
let unmountedFibers: Fiber[] = []
let wipFiber: FnFiber | null = null
let hookIndex: number = 0

// for testing purposes
let _requestIdleCallback: typeof requestIdleCallback

export type Fiber<T extends Obj = Obj> = {
	props: CProps<T>
	type: string
	dom: HTMLElement | Text | null
	parent: NFiber
	child: NFiber
	sibling: NFiber
	alternate?: NFiber | FnFiber
	effectTag?: "Update" | "Add" | "Remove"
}

const keys = <T extends Obj>(o: T) => Object.keys(o) as any as Array<keyof T>

const createElement = <T extends Obj>(
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
const isAdded = (prev: Obj, current: Obj) => (key: Key) => prev[key] !== current[key]
const isRemoved = (current: Obj) => (key: Key) => !(key in current)
const toEventType = (name: Key) => name.toString().toLowerCase().substring(2)

const getPropertiesDiff = (prev: Obj, current: Obj) => ({
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

const updateDom = (dom: Fiber["dom"], prev: Obj, current: Obj) => {
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
	nextUnitOfWork = buildFibers(nextUnitOfWork, deadline)
	if (!nextUnitOfWork && wipRoot) {
		unmountedFibers.forEach(commitWork)
		commitWork(wipRoot.child)
		currentRoot = wipRoot
		wipRoot = null
	}
	_requestIdleCallback(workLoop)
}

const buildFiber = (fiber: NFiber | FnFiber): NFiber => {
	if (!fiber) return null

	if (fiber.type instanceof Function) updateFunctionComponent(fiber as FnFiber)
	else updateHostComponent(fiber as Fiber)

	if (fiber.child) return fiber.child
	for (; fiber; fiber = fiber.parent) if (fiber.sibling) return fiber.sibling
	return null
}

const updateFunctionComponent = (fiber: FnFiber) => {
	wipFiber = fiber
	hookIndex = 0
	wipFiber.hooks = []
	const children = [fiber.type(fiber.props)]
	reconcileChildren(fiber as any as Fiber, children)
}

const updateHostComponent = (fiber: Fiber) => {
	if (!fiber.dom) fiber.dom = createDom(fiber)
	reconcileChildren(fiber, fiber.props.children || [])
}

const reconcileChildren = (fiber: Fiber, children: Array<CElement>) => {
	let prev: NFiber = null
	let oldFiber = fiber.alternate && fiber.alternate.child

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
	wipRoot = mkFiber({ type: WIP_ROOT, props: { children: [element] } }, { dom, alternate: currentRoot })
	unmountedFibers = []
	nextUnitOfWork = wipRoot
}

const commitDeletion = (fiber: Fiber, domParent: HTMLElement) => {
	if (fiber.dom) domParent.removeChild(fiber.dom)
	else commitDeletion(fiber.child as Fiber, domParent)
}

const commitWork = (fiber: NFiber) => {
	if (!fiber) return

	let domParentFiber: Fiber = fiber.parent as Fiber
	while (!domParentFiber.dom) domParentFiber = domParentFiber.parent as Fiber
	const domParent = domParentFiber.dom
	switch (fiber.effectTag) {
		case "Add":
			if (fiber.dom !== null) domParent.appendChild(fiber.dom)
			break
		case "Update":
			updateDom(fiber.dom as any, fiber.alternate?.props || { children: [] }, fiber.props)
			break
		case "Remove":
			commitDeletion(fiber, domParent as HTMLElement)
			break
	}

	commitWork(fiber.child)
	commitWork(fiber.sibling)
}

type InternalUseStateHook<T> = { state: T; queue: Array<F1<T, T> | T> }
const getPrevHook = <T>(): InternalUseStateHook<T> | null => {
	if (!wipFiber) return null
	const alternate = wipFiber.alternate as FnFiber
	return alternate && alternate.hooks && alternate.hooks[hookIndex]
}

const useState = <T>(initial: T): UseStateHook<T> => {
	const prevHook = getPrevHook<T>()
	const hook: InternalUseStateHook<T> = { state: prevHook?.state || initial, queue: [] }
	hook.state = (prevHook?.queue || []).reduce(
		(acc: T, action) => (action instanceof Function ? action(acc) : action),
		hook.state
	)

	const setState = (action: F1<T, T> | T) => {
		hook.queue.push(action)
		nextUnitOfWork = wipRoot = mkFiber(
			{ type: WIP_ROOT, props: currentRoot?.props || {} },
			{ dom: currentRoot?.dom || null, alternate: currentRoot }
		)
		unmountedFibers = []
	}

	if (wipFiber) wipFiber.hooks.push(hook)
	hookIndex++
	return [hook.state, setState]
}

export const CReactInternal = { mkFiber, buildFibers, buildFiber, reconcileChildren, updateDom, getPropertiesDiff }
export const CReact = { createElement, useState, render }
