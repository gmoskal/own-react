/** @jsx CReact.createElement */
import { CReactInternal, CReact, Fiber } from "."
import { lazyToEqual, toEqual } from "./test-helpers"
describe("toPropertiesDiff()", () => {
	type Diff = ReturnType<typeof CReactInternal.getPropertiesDiff>
	const mkDiff =
		(d1: Partial<Diff["listeners"]>) =>
		(d2: Partial<Diff["props"]>): Diff => ({
			listeners: { added: [], removed: [], ...d1 },
			props: { added: [], removed: [], ...d2 }
		})

	const mkListeners = (delta: Partial<Diff["listeners"]>) => mkDiff(delta)({})
	const mkProps = mkDiff({})

	it(
		"detects added props",
		lazyToEqual(CReactInternal.getPropertiesDiff({}, { foo: "1" }), mkProps({ added: ["foo"] }))
	)
	it(
		"skips unchanged props",
		lazyToEqual(CReactInternal.getPropertiesDiff({ bar: 2 }, { foo: "1", bar: 2 }), mkProps({ added: ["foo"] }))
	)
	it(
		"detects changed props",
		lazyToEqual(
			CReactInternal.getPropertiesDiff({ bar: 1 }, { foo: "1", bar: 2 }),
			mkProps({ added: ["foo", "bar"] })
		)
	)

	it(
		"detects removed props",
		lazyToEqual(CReactInternal.getPropertiesDiff({ bar: 1 }, {}), mkProps({ removed: ["bar"] }))
	)

	it(
		"detects added listeners",
		lazyToEqual(
			CReactInternal.getPropertiesDiff({}, { onChange: () => null }),
			mkListeners({ added: ["onChange"] })
		)
	)
	it(
		"detects removed listeners",
		lazyToEqual(
			CReactInternal.getPropertiesDiff({ onChange: () => null }, {}),
			mkListeners({ removed: ["onChange"] })
		)
	)

	it("compares listeners correctly", () => {
		const onChange = () => null
		expect(CReactInternal.getPropertiesDiff({ onChange }, { onChange, onUpdate: () => null })).toEqual(
			mkListeners({ added: ["onUpdate"] })
		)
		expect(CReactInternal.getPropertiesDiff({ onChange }, { onChange: () => null, onUpdate: () => null })).toEqual(
			mkListeners({ removed: ["onChange"], added: ["onChange", "onUpdate"] })
		)
	})
})

describe("updateDom()", () => {
	it("adds properties", () => {
		const dom: any = {}
		CReactInternal.updateDom(dom, {}, { foo: 1 })
		expect(dom).toEqual({ foo: 1 })
	})

	it("removes properties", () => {
		const dom: any = { bar: 1 }
		CReactInternal.updateDom(dom, { bar: 1 }, { foo: 1 })
		expect(dom).toEqual({ foo: 1 })
	})

	it("adds event listener", () => {
		const addEventListener = jest.fn()
		const dom: Pick<HTMLElement, "addEventListener"> = { addEventListener }
		const onChange = () => null
		CReactInternal.updateDom(dom as any, {}, { onChange })
		expect(addEventListener).toBeCalledTimes(1)
		expect(addEventListener).toHaveBeenNthCalledWith(1, "change", onChange)
	})

	it("removes event listener", () => {
		const removeEventListener = jest.fn()
		const dom: Pick<HTMLElement, "removeEventListener"> = { removeEventListener }
		const onChange = () => null
		CReactInternal.updateDom(dom as any, { onChange }, {})
		expect(removeEventListener).toBeCalledTimes(1)
		expect(removeEventListener).toHaveBeenNthCalledWith(1, "change", onChange)
	})
})

describe("buildFiber()", () => {
	it("builds functional component with given props", async () => {
		const C1 = (p: { foo: number }) => <h1>{p.foo}</h1>
		const fnCmp = { ...CReactInternal.mkFiber({ type: "fn", props: { foo: "bar" } }), type: C1 as any }
		CReactInternal.buildFiber(fnCmp)
		const child = fnCmp.child as Fiber
		expect(child.type).toEqual("h1")
		const grandson = (child.props.children || [])[0] as any as Fiber
		expect(grandson.props.nodeValue).toEqual("bar")
	})
})

describe("reconcileChildren()", () => {
	it("does nothing when no children are present", () => {
		const h1 = CReactInternal.mkFiber({ type: "h1", props: { children: [] } })
		CReactInternal.reconcileChildren(h1, [])
		expect(h1.child).toEqual(null)
	})

	it("creates 1st child", () => {
		const children = [{ type: "b", props: { children: [] } }]
		const h1 = CReactInternal.mkFiber({ type: "h1", props: { children } })
		CReactInternal.reconcileChildren(h1, children)
		if (h1.child?.parent) h1.child.parent = null
		toEqual(h1.child, {
			parent: null,
			child: null,
			dom: null,
			sibling: null,
			type: "b",
			props: { children: [] },
			effectTag: "Add",
			alternate: null
		})
	})

	it("creates 1st and 2nd child", () => {
		const c1 = { type: "b", props: { children: [] } }
		const c2 = { type: "span", props: { children: [] } }
		const children = [c1, c2]
		const h1 = CReactInternal.mkFiber({ type: "h1", props: { children } })
		CReactInternal.reconcileChildren(h1, children)
		const f2: Fiber = {
			type: "span",
			parent: null,
			child: null,
			dom: null,
			sibling: null,
			props: { children: [] },
			alternate: null,
			effectTag: "Add"
		}
		const f1: Fiber = {
			type: "b",
			parent: null,
			child: null,
			dom: null,
			sibling: f2,
			props: { children: [] },
			alternate: null,
			effectTag: "Add"
		}
		if (h1.child?.parent) h1.child.parent = null
		if (h1.child?.sibling?.parent) h1.child.sibling.parent = null
		toEqual(h1.child, f1)
		toEqual(h1.child?.sibling, f2)
	})
})

describe("createElement()", () => {
	it("<img/>", lazyToEqual(CReact.createElement("img", {}), { type: "img", props: { children: [] } }))
	it(
		'<img src="foo">',
		lazyToEqual(CReact.createElement("img", { src: "foo" }), {
			type: "img",
			props: { src: "foo", children: [] }
		})
	)
	it(
		"<h1>hello</h1>",
		lazyToEqual(CReact.createElement("h1", {}, "hello"), {
			type: "h1",
			props: { children: [{ type: "TEXT_ELEMENT", props: { nodeValue: "hello", children: [] } }] }
		})
	)
	it(
		"<h1>hello<br/>world!</h1>",
		lazyToEqual(CReact.createElement("h1", {}, "hello", CReact.createElement("br"), "world!"), {
			type: "h1",
			props: {
				children: [
					{ type: "TEXT_ELEMENT", props: { nodeValue: "hello", children: [] } },
					{ type: "br", props: { children: [] } },
					{ type: "TEXT_ELEMENT", props: { nodeValue: "world!", children: [] } }
				]
			}
		})
	)
	it(
		"<h1>hello<br/>world!</h1> with jsx",
		lazyToEqual(
			<h1>
				hello
				<br />
				world!
			</h1>,
			{
				type: "h1",
				props: {
					children: [
						{ type: "TEXT_ELEMENT", props: { nodeValue: "hello", children: [] } },
						{ type: "br", props: { children: [] } },
						{ type: "TEXT_ELEMENT", props: { nodeValue: "world!", children: [] } }
					]
				}
			}
		)
	)
})
