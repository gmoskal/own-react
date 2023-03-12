declare namespace JSX {
	interface IntrinsicElements {
		[elemName: string]: any
	}
}
type TMap<K, T> = Record<K, T>
type SMap<T> = TMap<string, T>
type F0<Res = void> = () => Res
type F1<A1, Res = void> = (a1: A1) => Res
type AnyObject = Record<string | number, unknown>
type TypedOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
