/** @jsx CReact.createElement */
import { CReact } from "."

const render = (value: string) => {
	CReact.render(
		<div style="color: white; padding: 1em; font-size: 2em">
			<input autofocus="true" onInput={(e: any) => render(e.target.value)} value={value} />
			<h1>This page was generated using own-react {value}</h1>
			<img src="screenshot.png" />
		</div>,
		document.getElementById("root") as HTMLElement
	)
}
render("type something")
