import { Application, createModule } from "@anfo/huiserver"
import type {
  APIInstance,
  GetAPIPathParameters,
  GetAPIReq,
  GetAPIRes,
} from "../url"
import type { Middleware } from "koa"
import type { Prisma, PrismaClient } from "@prisma/client"
import type { DefaultArgs } from "@prisma/client/runtime/library"
import type { DropString, Slice } from "./types"

type TypePrisma = PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>
// type APIWithPaths<T extends APIInstance> = GetAPIPathParameters<T> extends []
//   ? T
//   : [T, ...GetAPIPathParameters<T>]

function _createController(app: Application) {
  return <
    WithPathsT extends APIInstance | [APIInstance, ...any[]],
    T extends WithPathsT extends any[] ? WithPathsT[0] : WithPathsT,
    PathParameters extends WithPathsT extends any[]
      ? Slice<WithPathsT, 1>[number]
      : never
  >(
    api: WithPathsT,
    ...middlewares: [
      ...Middleware[],
      (
        ctx: {
          params: {
            [k in DropString<PathParameters, ":?">]: string
          }
        } & {
          request: { body: GetAPIReq<T> }
        } & Parameters<Middleware>[0],
        //  & {
        //   [k in keyof PathParameters]: any
        // },
        next: Parameters<Middleware>[1]
      ) => Promise<GetAPIRes<T>> | GetAPIRes<T>
    ]
  ) => {
    const pathRest = (
      api instanceof Array ? api.slice(1) : []
    ) as GetAPIPathParameters<T>
    const finalAPI = (api instanceof Array ? api[0] : api) as T
    app.httpRouter[
      finalAPI.method.toLowerCase() as Lowercase<typeof finalAPI.method>
    ](finalAPI.path(...pathRest), ...(middlewares as Middleware[]))
  }
}

function _createUpdateController(app: Application, prisma: TypePrisma) {
  return <Model extends Uncapitalize<Prisma.ModelName>, T extends APIInstance>(
    url: T,
    db: Model,
    fields: Partial<
      Record<
        keyof NonNullable<Awaited<ReturnType<TypePrisma[Model]["findFirst"]>>>,
        string
      >
    >
  ) => {
    app.createController(
      [url, ":id" as const],
      app.guard.userv({
        params: {
          id: "truthyString",
        },
        body: fields,
      }),
      async (ctx) => {
        return (prisma[db].update as Function)({
          where: { id: ctx.params.id, userId: ctx.state.user!.id },
          data: Object.keys(fields).reduce((t, k) => {
            t[k] = (ctx.request.body as any)[k]
            return t
          }, {} as any),
        })
      }
    )
  }
}

declare module "@anfo/huiserver" {
  interface Application {
    createController: ReturnType<typeof _createController>
    createUpdateController: ReturnType<typeof _createUpdateController>
  }
}

export const createControllerHelperModule = (prisma: TypePrisma) =>
  createModule((app) => {
    app.createController = _createController(app)
    app.createUpdateController = _createUpdateController(app, prisma)
  }, "controllerHelper")
