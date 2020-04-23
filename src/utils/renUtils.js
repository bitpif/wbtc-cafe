
export const createTransaction = new Function("return " + `async function (t) {
    const e = [...this.params.contractParams.map(t => t.value), u.Ox(this.response.args.amount.toString(16)), u.Ox(this.response.args.nhash), u.Ox(this.signature)],
          r = h.payloadToShiftInABI(this.params.contractFn, this.params.contractParams),
          n = new c.default(),
          o = new n.eth.Contract(r).methods[this.params.contractFn](...e).encodeABI();
    return await d.withDefaultAccount(n, s({
      to: this.params.sendTo,
      data: o
    }, this.params.txConfig, {}, t));
}`)();

export const submitToEthereum = new Function("return " + `(t, e) => {
    const r = f.newPromiEvent();
    return (async () => {
      const n = [...this.params.contractParams.map(t => t.value), u.Ox(this.response.args.amount.toString(16)), u.Ox(this.response.args.nhash), u.Ox(this.signature)],
            o = h.payloadToShiftInABI(this.params.contractFn, this.params.contractParams),
            a = new c.default(t),
            i = new a.eth.Contract(o, this.params.sendTo).methods[this.params.contractFn](...n).send((await d.withDefaultAccount(a, s({}, this.params.txConfig, {}, e))));
      return f.forwardEvents(i, r), await new Promise((t, e) => i.once("confirmation", (e, r) => {
        t(r);
      }).catch(t => {
        try {
          if (d.ignoreError(t)) return void console.error(String(t));
        } catch (t) {}

        e(t);
      }));
    })().then(r.resolve).catch(r.reject), r.on("error", t => {
      try {
        if (d.ignoreError(t)) return void console.error(String(t));
      } catch (t) {}

      r.reject(t);
    }), r;
}`)();

export default {
    createTransaction,
    submitToEthereum
}
