type XTextTag = string | number
type XProps<T extends AnyObject> = { children: Array<XElement<AnyObject>> } & T

export type XTextElement<T extends XTextTag> = { type: string; props: XProps<{ nodeValue: T }> }
export type XElement<T extends AnyObject> = { type: string; props: XProps<T> } | XTextElement<XTextTag>

export const createElement = <T extends AnyObject>(
	type: string,
	props: T = {} as any,
	...children: Array<XElement<AnyObject> | XTextTag>
): XElement<T> => ({
	type,
	props: {
		...props,
		children: children.map(child => (typeof child === "object" ? child : createTextElement(child)))
	}
})

export const createTextElement = <T extends XTextTag>(text: T): XTextElement<T> => ({
	type: "TEXT_ELEMENT",
	props: {
		nodeValue: text,
		children: []
	}
})
