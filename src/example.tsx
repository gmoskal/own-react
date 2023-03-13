/** @jsx CReact.createElement */
import { CProps, CReact } from "."

const App = (p: CProps<{ initialText: string }>) => {
	const [text, setText] = CReact.useState(p.initialText)
	const [changes, setChanges] = CReact.useState(0)

	CReact.useEffect(() => {
		console.log(changes)
	}, [changes])

	const ch = (v: number) => Math.floor((v + changes * v) % 256)

	return (
		<div style={`color: rgb(${ch(122)}, ${ch(144)}, ${ch(87)}); padding: 1em; font-size: 2em;`}>
			<h1>This page was generated using own-react</h1>
			<input
				onInput={(e: any) => {
					setText(e.target.value)
					setChanges(p => p + 1)
				}}
				value={text}
				autofocus
			/>
			<h1>changes count: {changes}</h1>
			<img src="screenshot.png" />
		</div>
	)
}

CReact.render(<App initialText="type something" />, document.getElementById("root") as HTMLElement)
