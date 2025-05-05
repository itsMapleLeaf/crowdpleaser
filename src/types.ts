export type MaybeFunction<Args extends readonly unknown[], ReturnOrType> =
	| ReturnOrType
	| ((...args: Args) => ReturnOrType)
