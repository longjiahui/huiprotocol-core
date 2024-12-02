import {
  Method,
  APIInstance,
  PaginationAPIInstance,
  GetAPIPathParameters,
  GetAPIReq,
  GetAPIRes,
  GetPaginationExtraParams,
  isPaginationAPI,
  IsPaginationAPI,
} from "./url"

export function createAPIType(
  request: (options: { url: string; method: Method; data?: any }) => any
) {
  // 柯里化、让泛型推导一部分类型（URL）
  class API<T extends APIInstance> {
    url: T["path"]
    method: Method

    constructor(api: T) {
      this.url = api.path
      this.method = api.method
    }
    call(
      ...rest: GetAPIReq<T> extends void
        ? GetAPIPathParameters<T>
        : [
            ...GetAPIPathParameters<T>,
            ...(GetAPIReq<T> extends {} ? [GetAPIReq<T>?] : [GetAPIReq<T>])
          ]
    ) {
      const params = rest.slice(this.url.length)[0]
      const urlParams = rest
        .slice(0, this.url.length)
        .map((d) => d || "") as string[]
      return request({
        url: typeof this.url === "function" ? this.url(...urlParams) : this.url,
        method: this.method,
        data: params,
      }) as Promise<GetAPIRes<T>>
    }
  }

  class PaginationAPI<T extends PaginationAPIInstance> extends API<T> {
    constructor(api: T) {
      super(api)
    }

    callAll(
      ...rest: keyof GetPaginationExtraParams<T> extends never
        ? GetAPIPathParameters<T>
        : [
            ...GetAPIPathParameters<T>,
            ...(GetPaginationExtraParams<T> extends {}
              ? [GetPaginationExtraParams<T>?]
              : [GetPaginationExtraParams<T>])
          ]
    ) {
      return this.call(
        ...([
          ...rest.slice(0, this.url.length),
          {
            pageNo: 1,
            pageSize: 9999999,
            ...((
              rest.slice(this.url.length) as GetPaginationExtraParams<T>[]
            )?.[0] || {}),
          },
        ] as unknown as Parameters<typeof this.call>)
      )
    }
  }
  return {
    API,
    PaginationAPI,
  }
}

// type Key = keyof typeof urls
export function createAPIs<
  URLs extends Record<any, APIInstance | PaginationAPIInstance>,
  Key extends keyof URLs
>(apiType: ReturnType<typeof createAPIType>, urls: URLs) {
  return Object.keys(urls).reduce(
    (t, k) => {
      t[k as Key] = isPaginationAPI(urls[k as Key])
        ? new apiType.PaginationAPI(urls[k as Key])
        : (new apiType.API(urls[k as Key]) as any)
      return t
    },
    {} as {
      [k in Key]: IsPaginationAPI<(typeof urls)[k]> extends true
        ? InstanceType<typeof apiType.PaginationAPI<(typeof urls)[k]>>
        : InstanceType<typeof apiType.API<(typeof urls)[k]>>
    }
  )
}
