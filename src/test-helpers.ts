export const lazyToEqual =
	<T>(actual: T, expected: T) =>
	() =>
		toEqual(actual, expected)
export const toEqual = <T>(actual: T, expected: T) => expect(actual).toEqual(expected)
