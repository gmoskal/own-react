/** @jsx CReact.createElement */
import { CReact } from "."
CReact.init()
CReact.render(
	<div style="color: white;  padding: 1em; font-size: 3em">
		<h1>This page was generated using own-react</h1>
		<img src="screenshot.png" />
	</div>,
	document.getElementById("root") as HTMLElement
)
