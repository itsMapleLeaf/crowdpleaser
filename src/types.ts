export type MaybeFunction<Value, Args extends readonly unknown[] = []> =
	| Value
	| ((...args: Args) => Value)
