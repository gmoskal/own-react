/** @jsx CReact.createElement */
import { CProps, CReact } from "."

const App = (p: CProps<{ initialText: string }>) => {
	const [text, setText] = CReact.useState(p.initialText)
	const [changes, setChanges] = CReact.useState(0)
	const cb = (v: string) => {
		setText(v)
		setChanges(p => p + 1)
	}
	return (
		<div style="color: white; padding: 1em; font-size: 2em">
			<h1>This page was generated using own-react</h1>
			<input onInput={(e: any) => cb(e.target.value)} value={text} autofocus />
			<h1>changes count: {changes}</h1>
			<img src="screenshot.png" />
		</div>
	)
}

CReact.render(<App initialText="type something" />, document.getElementById("root") as HTMLElement)
