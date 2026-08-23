/* eslint-disable */
// @ts-nocheck
// noinspection JSUnusedGlobalSymbols
// Generated route tree snapshot; the TanStack Router plugin regenerates this during builds.
import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as EditorRouteImport } from './routes/editor'
import { Route as FeaturesRouteImport } from './routes/features'
import { Route as HowItWorksRouteImport } from './routes/how-it-works'
import { Route as AboutRouteImport } from './routes/about'
import { Route as ContactRouteImport } from './routes/contact'
import { Route as PrivacyPolicyRouteImport } from './routes/privacy-policy'
import { Route as TermsRouteImport } from './routes/terms'
import { Route as CookiePolicyRouteImport } from './routes/cookie-policy'
import { Route as BlogRouteImport } from './routes/blog'
import { Route as BlogIndexRouteImport } from './routes/blog.index'
import { Route as BlogSlugRouteImport } from './routes/blog.$slug'
import { Route as SitemapXmlRouteImport } from './routes/sitemap[.]xml'
import { Route as ApiPublicRenderWorkerRouteImport } from './routes/api/public/render-worker'

const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const EditorRoute = EditorRouteImport.update({ id: '/editor', path: '/editor', getParentRoute: () => rootRouteImport } as any)
const FeaturesRoute = FeaturesRouteImport.update({ id: '/features', path: '/features', getParentRoute: () => rootRouteImport } as any)
const HowItWorksRoute = HowItWorksRouteImport.update({ id: '/how-it-works', path: '/how-it-works', getParentRoute: () => rootRouteImport } as any)
const AboutRoute = AboutRouteImport.update({ id: '/about', path: '/about', getParentRoute: () => rootRouteImport } as any)
const ContactRoute = ContactRouteImport.update({ id: '/contact', path: '/contact', getParentRoute: () => rootRouteImport } as any)
const PrivacyPolicyRoute = PrivacyPolicyRouteImport.update({ id: '/privacy-policy', path: '/privacy-policy', getParentRoute: () => rootRouteImport } as any)
const TermsRoute = TermsRouteImport.update({ id: '/terms', path: '/terms', getParentRoute: () => rootRouteImport } as any)
const CookiePolicyRoute = CookiePolicyRouteImport.update({ id: '/cookie-policy', path: '/cookie-policy', getParentRoute: () => rootRouteImport } as any)
const BlogRoute = BlogRouteImport.update({ id: '/blog', path: '/blog', getParentRoute: () => rootRouteImport } as any)
const BlogIndexRoute = BlogIndexRouteImport.update({ id: '/blog/', path: '/', getParentRoute: () => BlogRoute } as any)
const BlogSlugRoute = BlogSlugRouteImport.update({ id: '/blog/$slug', path: '/$slug', getParentRoute: () => BlogRoute } as any)
const SitemapXmlRoute = SitemapXmlRouteImport.update({ id: '/sitemap.xml', path: '/sitemap.xml', getParentRoute: () => rootRouteImport } as any)
const ApiPublicRenderWorkerRoute = ApiPublicRenderWorkerRouteImport.update({ id: '/api/public/render-worker', path: '/api/public/render-worker', getParentRoute: () => rootRouteImport } as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/editor': typeof EditorRoute
  '/features': typeof FeaturesRoute
  '/how-it-works': typeof HowItWorksRoute
  '/about': typeof AboutRoute
  '/contact': typeof ContactRoute
  '/privacy-policy': typeof PrivacyPolicyRoute
  '/terms': typeof TermsRoute
  '/cookie-policy': typeof CookiePolicyRoute
  '/blog': typeof BlogIndexRoute
  '/blog/$slug': typeof BlogSlugRoute
  '/sitemap.xml': typeof SitemapXmlRoute
  '/api/public/render-worker': typeof ApiPublicRenderWorkerRoute
}
export interface FileRoutesByTo extends FileRoutesByFullPath {}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/editor': typeof EditorRoute
  '/features': typeof FeaturesRoute
  '/how-it-works': typeof HowItWorksRoute
  '/about': typeof AboutRoute
  '/contact': typeof ContactRoute
  '/privacy-policy': typeof PrivacyPolicyRoute
  '/terms': typeof TermsRoute
  '/cookie-policy': typeof CookiePolicyRoute
  '/blog/': typeof BlogIndexRoute
  '/blog/$slug': typeof BlogSlugRoute
  '/sitemap.xml': typeof SitemapXmlRoute
  '/api/public/render-worker': typeof ApiPublicRenderWorkerRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: keyof FileRoutesByFullPath
  fileRoutesByTo: FileRoutesByTo
  to: keyof FileRoutesByFullPath
  id: '__root__' | keyof FileRoutesById
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  EditorRoute: typeof EditorRoute
  FeaturesRoute: typeof FeaturesRoute
  HowItWorksRoute: typeof HowItWorksRoute
  AboutRoute: typeof AboutRoute
  ContactRoute: typeof ContactRoute
  PrivacyPolicyRoute: typeof PrivacyPolicyRoute
  TermsRoute: typeof TermsRoute
  CookiePolicyRoute: typeof CookiePolicyRoute
  BlogRoute: typeof BlogRoute
  SitemapXmlRoute: typeof SitemapXmlRoute
  ApiPublicRenderWorkerRoute: typeof ApiPublicRenderWorkerRoute
}
const rootRouteChildren: RootRouteChildren = { IndexRoute, EditorRoute, FeaturesRoute, HowItWorksRoute, AboutRoute, ContactRoute, PrivacyPolicyRoute, TermsRoute, CookiePolicyRoute, BlogRoute, SitemapXmlRoute, ApiPublicRenderWorkerRoute }
export const routeTree = rootRouteImport._addFileChildren({ ...rootRouteChildren, BlogRoute: BlogRoute._addFileChildren({ BlogIndexRoute, BlogSlugRoute }) })._addFileTypes<FileRouteTypes>()
import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' { interface Register { ssr: true; router: Awaited<ReturnType<typeof getRouter>>; config: Awaited<ReturnType<typeof startInstance.getOptions>> } }
