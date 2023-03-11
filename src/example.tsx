/** @jsx CReact.createElement */
import { CReact } from "."
CReact.init()
CReact.render(
	<div style="background: grey; color: white; text-align:center; padding: 1em; font-size: 4em">
		<h1>This text was generated using cReact</h1>
	</div>,
	document.getElementById("root") as HTMLElement
)
