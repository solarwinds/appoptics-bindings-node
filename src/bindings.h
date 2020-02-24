#ifndef NODE_OBOE_H_
#define NODE_OBOE_H_

#include <iostream>
#include <string>

#include <napi.h>
#include <oboe/oboe.h>

typedef int (*send_generic_span_t) (char*, uint16_t, oboe_span_params_t*);

//
// Metadata is an empty module now. Remove it.
//
namespace Metadata {
  Napi::Object Init(Napi::Env, Napi::Object);
}

//
// new Event is a namespace for oboe_event-related functions
// and declarations.
//
namespace Event {
  Napi::Object Init(Napi::Env, Napi::Object);
}

//
// Settings is a collection of functions for getting/setting
// oboe's tracing settings
//
namespace Settings {
  Napi::Object Init(Napi::Env, Napi::Object);
}

//
// Reporter is a collection of functions providing access to oboe's
// send functions.
//
namespace Reporter {
  Napi::Object Init(Napi::Env, Napi::Object);
}

//
// Sanitizer provides the sanitize function.
//
namespace Sanitizer {
  Napi::Object Init(Napi::Env, Napi::Object);
}

//
// Config provides the getVersionString function.
//
namespace Config {
  Napi::Object Init(Napi::Env, Napi::Object);
}

#endif  // NODE_OBOE_H_
