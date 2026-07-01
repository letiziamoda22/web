"use client";

import { useState } from "react";

interface RequestItem {
  method: string;
  url: string;
  status: number;
  duration: number;
  timestamp: string;
  requestBody?: any;
  responseBody?: any;
}

interface Props {
  requests: RequestItem[];
}

export default function AdminRequestMonitor({ requests }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const formatJson = (data: unknown) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="rounded border border-[#e2ddd5] bg-white p-6">
      <h3 className="mb-4 text-xl font-semibold">Monitor de requests</h3>

      <div className="space-y-3 max-h-[40rem] overflow-y-auto">
        {requests.length === 0 ? (
          <p className="text-sm text-[#6b6259]">No hay requests aún.</p>
        ) : (
          requests.map((request, index) => (
            <div
              key={index}
              className="rounded border border-[#e2ddd5] bg-[#fbfaf7] p-3"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedIndex(expandedIndex === index ? null : index)
                }
                className="w-full text-left"
              >
                <div className="flex items-center justify-between gap-2 text-sm font-semibold text-[#17130f]">
                  <span>{request.method}</span>
                  <span>{request.status}</span>
                  <span>{request.timestamp.slice(11, 19)}</span>
                </div>
              </button>

              {expandedIndex === index && (
                <div className="mt-3 text-xs text-[#6b6259]">
                  <div className="mb-2">
                    <strong>URL:</strong> {request.url}
                  </div>

                  {request.requestBody !== undefined && (
                    <div className="mb-2">
                      <strong>Request:</strong>
                      <pre className="mt-1 overflow-x-auto rounded border border-[#e2ddd5] bg-white p-2 text-xs">
                        {formatJson(request.requestBody)}
                      </pre>
                    </div>
                  )}

                  {request.responseBody !== undefined && (
                    <div className="mb-2">
                      <strong>Response:</strong>
                      <pre className="mt-1 overflow-x-auto rounded border border-[#e2ddd5] bg-white p-2 text-xs">
                        {formatJson(request.responseBody)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}