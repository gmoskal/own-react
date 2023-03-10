/** @jsx CReact.createElement */
import { buildChildren, CReact, Fiber } from "."
import { lazyToEqual, toEqual } from "./test-helpers"

describe("buildSiblings()", () => {
	it("does nothing when no children are present", () => {
		const h1 = Fiber({ type: "h1", props: { children: [] } })
		buildChildren(h1)
		expect(h1.child).toEqual(null)
	})

	it("creates 1st child", () => {
		const h1 = Fiber({ type: "h1", props: { children: [{ type: "b", props: { children: [] } }] } })
		buildChildren(h1)
		toEqual(h1.child, { parent: h1, child: null, dom: null, sibling: null, type: "b", props: { children: [] } })
	})

	it("creates 1st and 2nd child", () => {
		const c1 = { type: "b", props: { children: [] } }
		const c2 = { type: "span", props: { children: [] } }
		const h1 = Fiber({ type: "h1", props: { children: [c1, c2] } })
		buildChildren(h1)
		const f2 = { type: "span", parent: h1, child: null, dom: null, sibling: null, props: { children: [] } }
		const f1 = { type: "b", parent: h1, child: null, dom: null, sibling: f2, props: { children: [] } }
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
