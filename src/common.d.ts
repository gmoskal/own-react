type AnyObject = Record<string | number, unknown>
declare namespace JSX {
	interface IntrinsicElements {
		[elemName: string]: any
	}
}
