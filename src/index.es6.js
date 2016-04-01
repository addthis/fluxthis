import 'babel-polyfill';

import Dispatcher from 'dispatcher/dispatcher';
import Context from 'context/context';
import Action from 'action/action';
import Store from 'store/store';

import mutable from 'decorators/mutable';
import handle from 'decorators/handle';
import view from 'decorators/view';

export {
	Dispatcher as Dispatcher,
	Context as Context,
	Action as Action,
	Store as Store,
	mutable as mutable,
	handle as handle,
	view as view
};
