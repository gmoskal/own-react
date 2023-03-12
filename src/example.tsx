/** @jsx CReact.createElement */
import { CProps, CReact } from "."

const App = ({ text }: CProps<{ text: string }>) => (
	<div style="color: white; padding: 1em; font-size: 2em">
		<input autofocus="true" onInput={(e: any) => render(e.target.value)} value={text} />
		<h1>This page was generated using own-react {text}</h1>
		<img src="screenshot.png" />
	</div>
)

const render = (text: string) => {
	CReact.render(<App text={text} />, document.getElementById("root") as HTMLElement)
}
render("type something")
