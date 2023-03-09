/** @jsx CReact.createElement */
import { CReact } from "."
import { lazyToEqual } from "./test-helpers"

describe("createTextElement()", () => {
	it(
		"string",
		lazyToEqual(CReact.createTextElement("foo"), {
			type: "TEXT_ELEMENT",
			props: { nodeValue: "foo", children: [] }
		})
	)
	it(
		"number",
		lazyToEqual(CReact.createTextElement(1), { type: "TEXT_ELEMENT", props: { nodeValue: 1, children: [] } })
	)
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
