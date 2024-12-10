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

export type APIInstance<Req = any, Res = any> = InstanceType<
  ReturnType<typeof API<Req, Res>>
>
export type PaginationAPIInstance<
  Data = any,
  ExtraParams extends object = object
> = InstanceType<ReturnType<typeof PaginationAPI<Data, ExtraParams>>>

export type GetAPIReq<T extends APIInstance> = IsPaginationAPI<T> extends true
  ? PaginationBody & GetPaginationAPIData<T>
  : T["_APIType"] extends typeof API<infer Req, any>
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
export type IsPaginationAPI<T extends APIInstance> = (
  T["_APIType"] extends typeof API<infer Req, any> ? Req : never
) extends PaginationBody
  ? true
  : false

export function isPaginationAPI(
  api: APIInstance
): api is PaginationAPIInstance {
  return api._type === "PaginationAPI"
}

export function crud<Entity extends { id: string }>() {
  return <Name extends string>(entityName: Name) => {
    const paginationAPI = new (PaginationAPI<Entity>())(
      () => `/${entityName}/pagination`
    )
    const getAPI = new (API<void, Entity>())((id) => `/${entityName}/get/${id}`)
    const createAPI = new (API<
      Omit<Entity, keyof Pick<Entity, "id">>,
      Entity
    >())(() => `/${entityName}/create`)
    const updateAPI = new (API<Partial<Entity>, Entity>())(
      (id) => `/${entityName}/update/${id}`
    )
    const deleteAPI = new (API<{ id: string }, void>())(
      (id) => `/${entityName}/delete/${id}`
    )
    const ret = {
      [`${entityName}Pagination`]: paginationAPI,
      [`${entityName}Get`]: getAPI,
      [`${entityName}Create`]: createAPI,
      [`${entityName}Update`]: updateAPI,
      [`${entityName}Delete`]: deleteAPI,
    }
    return ret as {
      [k in `${Name}Pagination`]: typeof paginationAPI
    } & {
      [k in `${Name}Get`]: typeof getAPI
    } & {
      [k in `${Name}Create`]: typeof createAPI
    } & {
      [k in `${Name}Update`]: typeof updateAPI
    } & {
      [k in `${Name}Delete`]: typeof deleteAPI
    }
  }
}
