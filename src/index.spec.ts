import { createElement, createTextElement } from "."
import { lazyToEqual } from "./test-helpers"

describe("createTextElement()", () => {
	it(
		"string",
		lazyToEqual(createTextElement("foo"), { type: "TEXT_ELEMENT", props: { nodeValue: "foo", children: [] } })
	)
	it("number", lazyToEqual(createTextElement(1), { type: "TEXT_ELEMENT", props: { nodeValue: 1, children: [] } }))
})

describe("createElement()", () => {
	it("<img/>", lazyToEqual(createElement("img", {}), { type: "img", props: { children: [] } }))
	it(
		'<img src="foo">',
		lazyToEqual(createElement("img", { src: "foo" }), {
			type: "img",
			props: { src: "foo", children: [] }
		})
	)
	it(
		"<h1>hello</h1>",
		lazyToEqual(createElement("h1", {}, "hello"), {
			type: "h1",
			props: { children: [{ type: "TEXT_ELEMENT", props: { nodeValue: "hello", children: [] } }] }
		})
	)
	it(
		"<h1>hello<br/>world!</h1>",
		lazyToEqual(createElement("h1", {}, "hello", createElement("br"), "world!"), {
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
})
