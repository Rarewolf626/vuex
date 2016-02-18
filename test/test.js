import { expect } from 'chai'
import Vue from 'vue'
import Vuex from '../src'
import * as util from '../src/util'

Vue.use(Vuex)

const TEST = 'TEST'

describe('Vuex', () => {
  it('direct dispatch', () => {
    const store = new Vuex.Store({
      state: {
        a: 1
      },
      mutations: {
        [TEST] (state, n) {
          state.a += n
        }
      }
    })
    store.dispatch(TEST, 2)
    expect(store.state.a).to.equal(3)
  })

  it('injecting state and action to components', function () {
    const store = new Vuex.Store({
      state: {
        a: 1
      },
      mutations: {
        [TEST] (state, n) {
          state.a += n
        }
      }
    })
    const vm = new Vue({
      store,
      vuex: {
        state: {
          a: state => state.a
        },
        actions: {
          test: ({ dispatch }, n) => dispatch(TEST, n)
        }
      }
    })
    vm.test(2)
    expect(vm.a).to.equal(3)
    expect(store.state.a).to.equal(3)
  })

  it('modules', function () {
    const mutations = {
      [TEST] (state, n) {
        state.a += n
      }
    }
    const store = new Vuex.Store({
      state: {
        a: 1
      },
      mutations,
      modules: {
        one: {
          state: { a: 2 },
          mutations
        },
        two: {
          state: { a: 3 },
          mutations
        }
      }
    })
    store.dispatch(TEST, 1)
    expect(store.state.a).to.equal(2)
    expect(store.state.one.a).to.equal(3)
    expect(store.state.two.a).to.equal(4)
  })

  it('hot reload', function () {
    const mutations = {
      [TEST] (state, n) {
        state.a += n
      }
    }
    const store = new Vuex.Store({
      state: {
        a: 1
      },
      mutations,
      modules: {
        one: {
          state: { a: 2 },
          mutations
        },
        two: {
          state: { a: 3 },
          mutations
        }
      }
    })
    store.dispatch(TEST, 1)
    expect(store.state.a).to.equal(2)
    expect(store.state.one.a).to.equal(3)
    expect(store.state.two.a).to.equal(4)

    // hot reload only root mutations
    store.hotUpdate({
      mutations: {
        [TEST] (state, n) {
          state.a = n
        }
      }
    })
    store.dispatch(TEST, 1)
    expect(store.state.a).to.equal(1) // only root mutation updated
    expect(store.state.one.a).to.equal(4)
    expect(store.state.two.a).to.equal(5)

    // hot reload modules
    store.hotUpdate({
      modules: {
        one: {
          state: { a: 234 },
          mutations: {
            [TEST] (state, n) {
              state.a += n
            }
          }
        },
        two: {
          state: { a: 345 },
          mutations: {
            [TEST] (state, n) {
              state.a -= n
            }
          }
        }
      }
    })
    store.dispatch(TEST, 2)
    expect(store.state.a).to.equal(2)
    expect(store.state.one.a).to.equal(6) // should not reload initial state
    expect(store.state.two.a).to.equal(3) // should not reload initial state

    // hot reload all
    store.hotUpdate({
      mutations: {
        [TEST] (state, n) {
          state.a -= n
        }
      },
      modules: {
        one: {
          state: { a: 234 },
          mutations: {
            [TEST] (state, n) {
              state.a = n
            }
          }
        },
        two: {
          state: { a: 345 },
          mutations: {
            [TEST] (state, n) {
              state.a = n
            }
          }
        }
      }
    })
    store.dispatch(TEST, 3)
    expect(store.state.a).to.equal(-1)
    expect(store.state.one.a).to.equal(3)
    expect(store.state.two.a).to.equal(3)
  })

  it('middleware', function () {
    let initState
    const mutations = []
    const store = new Vuex.Store({
      state: {
        a: 1
      },
      actions: {
        test: TEST
      },
      mutations: {
        [TEST] (state, n) {
          state.a += n
        }
      },
      middlewares: [
        {
          onInit (state) {
            initState = state
          },
          onMutation (mut, state) {
            expect(state).to.equal(store.state)
            mutations.push(mut)
          }
        }
      ]
    })
    expect(initState).to.equal(store.state)
    store.actions.test(2)
    expect(mutations.length).to.equal(1)
    expect(mutations[0].type).to.equal(TEST)
    expect(mutations[0].payload[0]).to.equal(2)
  })

  it('middleware with snapshot', function () {
    let initState
    const mutations = []
    const store = new Vuex.Store({
      state: {
        a: 1
      },
      actions: {
        test: TEST
      },
      mutations: {
        [TEST] (state, n) {
          state.a += n
        }
      },
      middlewares: [
        {
          snapshot: true,
          onInit (state) {
            initState = state
          },
          onMutation (mutation, nextState, prevState) {
            mutations.push({
              mutation,
              nextState,
              prevState
            })
          }
        }
      ]
    })
    expect(initState).not.to.equal(store.state)
    expect(initState.a).to.equal(1)
    store.actions.test(2)
    expect(mutations.length).to.equal(1)
    expect(mutations[0].mutation.type).to.equal(TEST)
    expect(mutations[0].mutation.payload[0]).to.equal(2)
    expect(mutations[0].nextState).not.to.equal(store.state)
    expect(mutations[0].prevState.a).to.equal(1)
    expect(mutations[0].nextState.a).to.equal(3)
  })

  it('strict mode: warn mutations outside of handlers', function () {
    const store = new Vuex.Store({
      state: {
        a: 1
      },
      actions: {
        test: ({ dispatch, state }) => {
          state.a++
        }
      },
      strict: true
    })
    expect(() => {
      store.actions.test(2)
    }).to.throw(/Do not mutate vuex store state outside mutation handlers/)
  })
})
