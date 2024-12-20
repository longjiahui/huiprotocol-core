import { PaginationBody } from "../typings"

export function transformPaginationParams(body: PaginationBody) {
  return {
    take: body.pageSize,
    skip: (body.pageNo - 1) * body.pageSize,
  }
}
