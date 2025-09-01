package handlers

import "github.com/google/uuid"

type CommonResponse struct {
	Code    int    `json:"code"`
	Msg     string `json:"msg"`
	TraceId string `json:"trace_id"`
}

func commonSucResp(msg string) *CommonResponse {
	return &CommonResponse{
		Code:    200,
		Msg:     msg,
		TraceId: GenerateTraceID(),
	}
}

func commonErrResp(code int, msg string) *CommonResponse {
	return &CommonResponse{
		Code:    code,
		Msg:     msg,
		TraceId: GenerateTraceID(),
	}
}

func serverErrResp(msg string) *CommonResponse {
	return &CommonResponse{
		Code:    500,
		Msg:     msg,
		TraceId: GenerateTraceID(),
	}
}

func GenerateTraceID() string {
	return uuid.New().String()
}
