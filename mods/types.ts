// Slice the first element of an array
type _Slice0<T extends any> = T extends [any, ...infer B] ? B : never
// Slice the last element of an array
type _SliceLast<T extends any> = T extends [...infer B, any] ? B : never

type Tuple<T extends number, U extends any[] = []> = U["length"] extends T
  ? U
  : Tuple<T, [...U, any]>

// 数字相减
type Subtract<A extends number, B extends number> = Tuple<A> extends [
  ...Tuple<B>,
  ...infer R
]
  ? R["length"]
  : never

// 数字相加
// type Add<A extends number, B extends number> = [
//   ...Tuple<A>,
//   ...Tuple<B>
// ] extends [...infer T]
//   ? T["length"]
//   : never

// Slice array [T] from [From] to [To]
export type Slice<
  T extends any[],
  From extends number = 0,
  To extends number = 0
> = From extends 0
  ? To extends 0
    ? T
    : Slice<_SliceLast<T>, From, Subtract<To, 1>>
  : Slice<_Slice0<T>, Subtract<From, 1>, To>

export type DropChar<
  S extends string,
  R extends string
> = S extends `${infer A}${R}${infer B}` ? DropChar<`${A}${B}`, R> : S

// Drop string S from R
export type DropString<
  S extends string,
  R extends string
> = R extends `${infer F}${infer L}` ? DropString<DropChar<S, F>, L> : S
