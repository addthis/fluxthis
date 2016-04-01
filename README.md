# FluxThis 3.0

Massive re-write to give us more fine-grained control over what we throw when, and
to greatly reduce boilerplate code.

## Changes
The following is a comprehensive list of changes to the API. Check out the [example code](test/test.es6.js) for 
contrived examples.

### Store changes
- `ImmutableStore` has been removed. All stores are Immutable
- individual accessors on stores can be _explicitly declared mutable_, through the `@mutable` decorator
- `Immutable` is a peer dependency, instead of a normal dependency
- accessors do not need to be written in order to access immutable properties of stores
- accessing a mutable property will throw an error
- `bindActions` has been removed.  Instead, decorate hanldlers with `@handles(ActionCtr)`
- `ActionType` is no longer required. Instead, use the constructors of actions themelves
- `waitFor` has been removed. Instead, declare your dependent stores as 'children' of another store.
Children will always be updated before their parents.

### Action changes
- `ActionCreator` and `APIActionCreator` have been removed
- `Action` is a class that can be extended to declare actions. Actions can be enacted through
other actions `act` methods, or through view methods (with the exception of `render`)
- `this.enact(ActionCtr, arg0, arg1...)` creates actions, when in the context of `Action.act` or a
non-`render` view method

## TODO
These tasks need to be completed before we can release
- [ ] #134 migrate test cases from fluxthis 2
- [ ] #135 migrate gulpfile / decide if we still want to use gulp vs plain webpack
- [ ] create fluxthis 3.0 section of docs on fluxthis.io

