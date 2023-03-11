/** @jsx CReact.createElement */
import { CReact } from "."

CReact.render(
	<div style="color: white; padding: 1em; font-size: 2em">
		<h1>This page was generated using own-react</h1>
		<img src="screenshot.png" />
	</div>,
	document.getElementById("root") as HTMLElement
)
