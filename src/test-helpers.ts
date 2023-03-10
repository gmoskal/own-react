// declare const expect: <T>(v: T) => TypedOmit<jest.Matchers<T>, "toEqual"> & { toEqual: (v: T) => v is T }

export const lazyToEqual =
	<T>(actual: T, expected: T) =>
	() =>
		expect(actual).toEqual(expected)
export const toEqual = <T>(actual: T, expected: T) => expect(actual).toEqual(expected)
