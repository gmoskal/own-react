type CTextTag = string | number
type CProps<T extends AnyObject> = { children: Array<CElement<AnyObject>> } & T

export type CTextElement<T extends CTextTag> = { type: string; props: CProps<{ nodeValue: T }> }
export type CElement<T extends AnyObject> = { type: string; props: CProps<T> } | CTextElement<CTextTag>

const createElement = <T extends AnyObject>(
	type: string,
	props: T = {} as any,
	...children: Array<CElement<AnyObject> | CTextTag>
): CElement<T> => ({
	type,
	props: {
		...props,
		children: children.map(child => (typeof child === "object" ? child : createTextElement(child)))
	}
})

const createTextElement = <T extends CTextTag>(text: T): CTextElement<T> => ({
	type: "TEXT_ELEMENT",
	props: {
		nodeValue: text,
		children: []
	}
})

export const CReact = {
	createElement,
	createTextElement
}
