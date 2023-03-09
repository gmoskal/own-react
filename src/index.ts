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

const createTextElement = <T extends CTextTag>(text: T): CTextElement<T> => ({
	type: "TEXT_ELEMENT",
	props: {
		nodeValue: text,
		children: []
	}
})

const keys = <T extends AnyObject>(o: T) => Object.keys(o) as any as Array<keyof T>

const render = ({ type, props }: CElement, dest: HTMLElement) => {
	const node = type == "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(type)

	keys(props)
		.filter(key => key !== "children")
		.forEach(name => {
			;(node as any)[name] = props[name]
			console.log("setting node " + name + " = " + props[name])
		})
	if (type !== "TEXT_ELEMENT") props.children.forEach(child => render(child, node as HTMLElement))
	dest.appendChild(node)
}

export const CReact = {
	createElement,
	render
}
