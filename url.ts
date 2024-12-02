import type { PaginationData } from "@anfo/huiserver"
import type { PaginationBody } from "./typings"

export type Method = "POST" | "GET"
type PathType = (...rest: string[]) => string
export function API<Req = void, Res = void>() {
  return class<Path extends PathType> {
    _type: "API" | "PaginationAPI" = "API"
    method: Method
    _APIType = undefined as unknown as typeof API<Req, Res>
    constructor(
      public path: Path,
      options: {
        method?: Method
      } = {}
    ) {
      const { method } = Object.assign(
        {
          method: "POST",
        } satisfies typeof options,
        options
      )
      this.method = method
    }
  }
}

export type APIInstance = InstanceType<ReturnType<typeof API>>
export type PaginationAPIInstance = InstanceType<
  ReturnType<typeof PaginationAPI>
>

export function PaginationAPI<Data, ExtraParams extends object = object>() {
  return class<Path extends PathType> extends API<
    PaginationBody & ExtraParams,
    PaginationData<Data[]>
  >()<Path> {
    _APIType = undefined as unknown as typeof API<
      PaginationBody & ExtraParams,
      PaginationData<Data[]>
    >
    constructor(path: Path) {
      super(path)
      this._type = "PaginationAPI"
    }
  }
}

export type GetAPIReq<T extends APIInstance> = T["_APIType"] extends typeof API<
  infer Req,
  any
>
  ? Req
  : never
export type GetAPIRes<T extends APIInstance> = T["_APIType"] extends typeof API<
  any,
  infer Res
>
  ? Res
  : never
export type GetAPIPathParameters<T extends APIInstance> = Parameters<T["path"]>
export type GetPaginationAPIData<T extends PaginationAPIInstance> =
  GetAPIRes<T> extends PaginationData<infer R> ? R[number] : never
export type GetPaginationExtraParams<T extends PaginationAPIInstance> =
  T extends InstanceType<
    ReturnType<typeof PaginationAPI<any, infer R extends object>>
  >
    ? R
    : never
export type IsPaginationAPI<T extends APIInstance> =
  GetAPIReq<T> extends PaginationBody ? true : false

export function isPaginationAPI(
  api: APIInstance
): api is PaginationAPIInstance {
  return api._type === "PaginationAPI"
}
