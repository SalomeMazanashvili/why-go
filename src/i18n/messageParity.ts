import type en from '../../messages/en.json'
import type ka from '../../messages/ka.json'

// WHY-98 PR A: ka.json (primary) and en.json must define the same keys.
// AppConfig types messages from en.json, so a key missing only from ka.json
// would otherwise pass tsc and show its raw path on the Georgian site. On
// failure tsc names the offending dotted key paths in the error.
//
// Values aren't compared: `TODO: Georgian copy needed` is a valid ka value
// (founders write the copy in batches); scripts/count-todo-copy.sh reports
// how many remain, without failing CI.

type KeyPaths<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object ? `${K}.${KeyPaths<T[K]>}` : K
    }[keyof T & string]
  : never

type MissingFromKa = Exclude<KeyPaths<typeof en>, KeyPaths<typeof ka>>
type MissingFromEn = Exclude<KeyPaths<typeof ka>, KeyPaths<typeof en>>

type Expect<T extends never> = T

export type MessageParity = [Expect<MissingFromKa>, Expect<MissingFromEn>]
