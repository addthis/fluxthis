
## v2.5.2 (2/9/16)

 - [#120](https://github.com/addthis/fluxthis/pull/120) - Fixed setting Content-Type Header
 - [#120](https://github.com/addthis/fluxthis/pull/120) - Allow for string body types in the APIActionCreator.
 - [#120](https://github.com/addthis/fluxthis/pull/120) - Fixed deprecated message for `contentType` in the APIActionCreator.

## v2.5.1 (1/14/16)

 - [#112](https://github.com/addthis/fluxthis/issues/112) - fixed string check in test
 - Fixed including all license and notices in built files.

## v2.5.0 (1/12/16)

 - [#106](https://github.com/addthis/fluxthis/pull/106) - Added abort support to APIActionCreator
 - [#113](https://github.com/addthis/fluxthis/issues/113) -- Trigger error event for malformed JSON. Thanks @AlanFoster
 - [#105](https://github.com/addthis/fluxthis/issues/105) - Fixed is immutable check for ImmutableStore
 - [#110](https://github.com/addthis/fluxthis/pull/110) - Fixed windowless environment check for window object

## v2.4.0 (12/1/15)

 - [#100](https://github.com/addthis/fluxthis/issues/100) - support content type json w/ charset

## v2.3.1 (11/2/15)

 - Moved react to peer dependencies, and ensured comparability with react 0.14

## v2.2.3 (7/5/15)

 - Fixed registering actions/types in the API Action Creator & Action Creator.

## v2.2.2 (6/26/15)

 - Fixed bugs in router

## v2.2.1 (6/3/15)

 - Added support for request headers in the API Action Creator createRequest method

## v2.2.0 (6/2/15)

 - Incorporated fluxthis es6 generator router experimental feature

## v2.1.0 (5/21/15)

 - Deprecated actionSource in Action Creators
 - Deprecated payloadType & actionType in Action Creators. New keys are payload & type, respectively.

## v2.0.0 (5/21/15)

 - Removed the babel global polyfill in favor of runtime alternative. This means that any projects depending on this polyfill need to require it themselves manually.
