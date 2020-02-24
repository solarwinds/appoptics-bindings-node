#include "bindings.h"
#include <cmath>
#include <iomanip>

//
// return true if the object meets our expectations of what an Event should be
// otherwise return false.
//
bool validEvent (Napi::Object event) {
  if (!event.Has("Layer") || !event.Has("Label")) {
    return false;
  }
  if (!event.Has("_edges") || !event.Get("_edges").IsArray()) {
    return false;
  }

  Napi::Value kv = event.Get("kv");
  if (!kv.IsObject() || kv.IsArray()) {
    return false;
  }
  if (!kv.As<Napi::Object>().Has("Timestamp_u")) {
    return false;
  }

  Napi::Value mb = event.Get("mb");
  if (!mb.IsObject() || mb.IsArray()) {
    return false;
  }

  Napi::Value buf = mb.As<Napi::Object>().Get("buf");
  if (!buf.IsBuffer()) {
    return false;
  }
  Napi::Buffer<uint8_t> b = buf.As<Napi::Buffer<uint8_t>>();
  if (b.Length() != 30) {
    return false;
  }

  return true;
}

//
// initialize oboe_metadata_t structure from a Metabuf buffer
//
void initializeOboeMd(oboe_metadata_t &md, Napi::Buffer<uint8_t> b) {
  md.version = XTR_CURRENT_VERSION;

  // copy IDs
  const uint kTaskIdBase = 1;
  const uint kOpIdBase = kTaskIdBase + OBOE_MAX_TASK_ID_LEN;
  for (uint i = 0; i < OBOE_MAX_TASK_ID_LEN; i++) {
    md.ids.task_id[i] = b[kTaskIdBase + i];
  }
  for (uint i = 0; i < OBOE_MAX_OP_ID_LEN; i++) {
    md.ids.op_id[i] = b[kOpIdBase + i];
  }

  // initialize lengths
  md.task_len = OBOE_MAX_TASK_ID_LEN;
  md.op_len = OBOE_MAX_OP_ID_LEN;

  // and finally flags.
  md.flags = b[kOpIdBase + OBOE_MAX_OP_ID_LEN];
}

//
// add KV pair
//
// returns -1 if error.
//
int addKvPair(oboe_event_t* event, std::string key, Napi::Value value) {
  int status = -1;

  if (value.IsBoolean()) {
    status = oboe_event_add_info_bool(event, key.c_str(), value.As<Napi::Boolean>().Value());
  } else if (value.IsNumber()) {
    const double v = value.As<Napi::Number>();

    // it it's within integer range add an integer
    if (v > -(pow(2, 53) - 1) && v < pow(2, 53) -1) {
      status = oboe_event_add_info_int64(event, key.c_str(), v);
    } else {
      status = oboe_event_add_info_double(event, key.c_str(), v);
    }
  } else if (value.IsString()) {
    std::string s = value.As<Napi::String>();

    // make a stab at detecting binary data
    if (memchr(s.c_str(), '\0', s.length())) {
      status = oboe_event_add_info_binary(event, key.c_str(), s.c_str(), s.length());
    } else {
      status = oboe_event_add_info(event, key.c_str(), s.c_str());
    }
  }

  return status;
}

//
// add an edge
//
int addEdge(oboe_event_t* event, Napi::Value edge) {
  // oboe returns -1 for errors, so this returns an error of 1
  // so the two causes can be distinguished.
  int status = 1;

  if (!edge.IsObject() || edge.IsArray()) {
    return status;
  }

  Napi::Object mb = edge.As<Napi::Object>().Get("buf").As<Napi::Object>();
  Napi::Buffer<uint8_t> buf = mb.As<Napi::Buffer<uint8_t>>();

  oboe_metadata_t oboe_md;
  initializeOboeMd(oboe_md, buf);

  status = oboe_event_add_edge(event, &oboe_md);

  return status;
}

//
// Event send function. The edges and KVs have been validated
// by the JavaScript Event class so minimal checking is required.
//
Napi::Value send(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Invalid signature").ThrowAsJavaScriptException();
    return env.Null();
  }

  // the default is to use the OBOE_SEND_EVENT channel. A truthy second argument
  // will result in using the OBOE_SEND_STATUS channel.
  Napi::Object event = info[0].As<Napi::Object>();
  const int channel = info[1].ToBoolean().Value() ? OBOE_SEND_STATUS : OBOE_SEND_EVENT;
  //bool useStatusChannel = info[1].ToBoolean().Value();

  if (!validEvent(event)) {
    Napi::TypeError::New(env, "Not a valid Event").ThrowAsJavaScriptException();
    return env.Null();
  }

  // return a results object.
  Napi::Object result = Napi::Object::New(env);

  Napi::Object kvs = event.Get("kv").ToObject();

  // this is really an array and validEvent() verified that but
  // an array behaves like an object with int32 indexes/properties.
  Napi::Object edges = event.Get("_edges").ToObject();

  Napi::Object mb = event.Get("mb").As<Napi::Object>().Get("buf").As<Napi::Object>();
  Napi::Buffer<uint8_t> buf = mb.As<Napi::Buffer<uint8_t>>();

  // return any errors in this array.
  Napi::Array errors = Napi::Array::New(env);

  oboe_metadata_t oboe_md;
  oboe_event_t oboe_event;

  initializeOboeMd(oboe_md, buf);

  oboe_event_init(&oboe_event, &oboe_md, const_cast<const uint8_t*>(oboe_md.ids.op_id));

  // add the KV pairs
  Napi::Array kvKeys = kvs.GetPropertyNames();
  for (uint i = 0; i < kvKeys.Length(); i++) {
    Napi::EscapableHandleScope scope(env);
    Napi::Value v = kvKeys[i];
    std::string key = v.ToString();
    int status = addKvPair(&oboe_event, key, kvs.Get(key));
    if (status != 0) {
      Napi::Object err = Napi::Object::New(env);
      err.Set("error", "kv send failed");
      err.Set("key", key);
      err.Set("code", status);
      errors[errors.Length()] = err;
      scope.Escape(err);
    }
  }

  // add edges
  Napi::Array edgeIndexes = edges.GetPropertyNames();
  for (uint i = 0; i < edgeIndexes.Length(); i++) {
    Napi::EscapableHandleScope scope(env);
    Napi::Value v = edgeIndexes[i];
    std::string index = v.ToString();
    int status = addEdge(&oboe_event, edges.Get(index));
    if (status != 0) {
      Napi::Object err = Napi::Object::New(env);
      err.Set("error", "add edge failed");
      err.Set("edgeIndex", i);
      errors[errors.Length()] = err;
      scope.Escape(err);
    }
  }

  int status = oboe_event_add_hostname(&oboe_event);
  if (status != 0) {
    Napi::Object err = Napi::Object::New(env);
    err.Set("error", "add_hostname() failed");
    err.Set("code", status);
    errors[errors.Length()] = err;
  }

  // now ask oboe to send it, really.
  oboe_event.bb_str = oboe_bson_buffer_finish(&oboe_event.bbuf);
  if (!oboe_event.bb_str) {
    Napi::Object err = Napi::Object::New(env);
    err.Set("error", "failed to finish bson buffer");
    errors[errors.Length()] = err;
  }

  size_t bb_len = (size_t)(oboe_event.bbuf.cur - oboe_event.bbuf.buf);

  int send_status = oboe_raw_send(channel, oboe_event.bb_str, bb_len);

  if (send_status < (int)bb_len) {
    Napi::Object err = Napi::Object::New(env);
    err.Set("error", "failed to finish bson buffer");
    err.Set("code", send_status);
    errors[errors.Length()] = err;
  }

  /*
  for (uint i = 0; i < OBOE_MAX_TASK_ID_LEN; i++) {
    std::cout << std::hex << std::setfill('0') << std::setw(2) << (uint)oboe_md.ids.task_id[i];
  }
  std::cout << ":";
  for (uint i = 0; i < OBOE_MAX_OP_ID_LEN; i++) {
    std::cout << std::hex << std::setfill('0') << std::setw(2) << (uint)oboe_md.ids.op_id[i];
  }
  std::cout << "\n";
  // */

  result.Set("status", errors.Length() == 0);
  result.Set("errors", errors);
  result.Set("channel", channel);

  return result;
}

namespace Event {
  Napi::Object Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Object module = Napi::Object::New(env);

    module.Set("send", Napi::Function::New(env, send));
    module.Set("xtraceIdVersion", Napi::Number::New(env, XTR_CURRENT_VERSION));
    module.Set("taskIdLength", Napi::Number::New(env, OBOE_MAX_TASK_ID_LEN));
    module.Set("opIdLength", Napi::Number::New(env, OBOE_MAX_OP_ID_LEN));

    exports.Set("Event", module);

    return exports;
  }
}
