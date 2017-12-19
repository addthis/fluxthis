## v3.0.0 (12/19/17)

- [5c2a56](https://github.com/addthis/fluxthis/commit/5c2a56d324033daa4471144b284a1b1edf7e523d) Move Immutable.js to a peer dependency to reduce overall build size
- [c7ff40](https://github.com/addthis/fluxthis/commit/c7ff401c4be005875ec79d857e0cfafcd07afe19) Remove use of isMounted function which has been deprecated by React

## v2.9.1 (5/30/17)

- [18ee9d](https://github.com/addthis/fluxthis/commit/18ee9d9f9d5a008d5e095579b9c70286bc96250e) Ensure that Constant/ConstantCollection is JSON stringifiable

## v2.9.0 (10/11/16)

- [b1e205b](https://github.com/addthis/fluxthis/commit/b1e205baefbd53ad2f79d7bbfaabc875ba79eeb2) Expose response headers to APIActionCreators (thanks @matrinox)
- [5e465e0](https://github.com/addthis/fluxthis/commit/5e465e0366665548ca2133e4df0e7b06c1d3b70f) - Moved to 3rd party proptypes library as it's deprecated in React15 (#160)
- [a6cfbfe](https://github.com/addthis/fluxthis/commit/a6cfbfe00a60aaf78d8f5934258482ba695c5b73) - Update NOTICE and LICENSE (#158)

## v2.8.0 (6/21/16)

- [6529617](https://github.com/addthis/fluxthis/commit/652961716690a2e033591000811fad6a3f556e52) - Move babel to dev dependency (thanks @alistairjcbrown)
- [638e523](https://github.com/addthis/fluxthis/commit/638e52306540791a7f11d7e8963dcd17efb495c0) - Add ability to set default base URL for all requests via APIActionCreator
- [949891a](https://github.com/addthis/fluxthis/commit/949891a113eb01e55e93a3ce3428784153668ea8) - Allow setting default headers for all requests via APIActionCreator
- [a483df8](https://github.com/addthis/fluxthis/commit/a483df8b2ca9bbab08fc86fbc2cc511edf53cb83) - Allow named parameters with file extensions in routes
- miscellaneous bits of cleanup

## v2.7.1 (4/22/16)

- [d9d8c7e](https://github.com/addthis/fluxthis/commit/d9d8c7e0bc45dae4bef8775e3eb43999f5c1e920) - Allow other body types to API Action Creator

## v2.7.0 (4/15/16)

- [#133](https://github.com/addthis/fluxthis/issues/133) - ImmutableReducerStore thanks @AlanFoster

## v2.6.1 (3/9/16)

- [#132](https://github.com/addthis/fluxthis/pull/132) - Fixed default route in router

## v2.6.0 (2/16/16)

- [#126](https://github.com/addthis/fluxthis/pull/126) - Fixed emitChanges until after dispatch. Potential huge performance increase in react 14+
- [#128](https://github.com/addthis/fluxthis/pull/128) - Tweaked decorator syntax to support a list of stores
- [#124](https://github.com/addthis/fluxthis/pull/124) - Added es6 class support for stores using decorator.

## v2.5.4 (2/10/16)

- [#121](https://github.com/addthis/fluxthis/issues/121) - Fixes dispatching failure type on success response in API.

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
