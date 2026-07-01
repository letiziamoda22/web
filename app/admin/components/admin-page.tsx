"use client";

import { useEffect, useMemo, useState } from "react";
import AdminCustomerSection from "./admin-customer-section";
import AdminOrderForm from "./admin-order-form";
import AdminRequestMonitor from "./admin-request-monitor";

type Order = {
  id: string;
  createdAt: string;
  status: string;
  source: string;
  paymentStatus: string;
  stripeSessionId?: string | null;
  paidAt?: string | null;
  customer: {
    name: string;
    email: string;
    phone: string;
    notes: string;
    nif?: string;
    address?: string;
  };
  items: Array<{
    slug: string;
    name: string;
    category: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  total: number;
};

type CustomerSection = {
  customer: {
    name: string;
    email: string;
    phone: string;
    nif?: string;
    address?: string;
  };
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
  orders: Order[];
  items: Array<{
    slug: string;
    name: string;
    category: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
};

type Credentials = {
  username: string;
  password: string;
};

type OrderType = "individual" | "empresa";
type PaymentFilter = "todos" | "pendiente" | "pagado";

const apiUrls: Record<OrderType, string> = {
  individual: "/api/admin/orders",
  empresa: "/api/admin/mayorista",
};

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<OrderType>("individual");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("todos");
  const [customers, setCustomers] = useState<CustomerSection[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<Credentials>({ username: "", password: "" });

  useEffect(() => {
    const stored = window.sessionStorage.getItem("tanna-admin-authenticated");
    if (stored === "true") {
      setAuthenticated(true);
      fetchCustomers(orderType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addRequest(request: any) {
    setRequests((prev) => [request, ...prev].slice(0, 50));
  }

  function switchOrderType(type: OrderType) {
    if (type === orderType) return;
    setOrderType(type);
    setSelectedOrder(null);
    setShowForm(false);
    fetchCustomers(type);
  }

  async function login() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      addRequest({
        method: "POST",
        url: "/api/admin/login",
        status: response.status,
        duration: 0,
        timestamp: new Date().toISOString(),
        requestBody: credentials,
        responseBody: data,
      });

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      window.sessionStorage.setItem("tanna-admin-authenticated", "true");
      setAuthenticated(true);
      fetchCustomers(orderType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al autenticarse");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomers(type: OrderType) {
    setLoading(true);
    setError(null);

    const apiUrl = apiUrls[type];

    try {
      const response = await fetch(apiUrl, { method: "GET" });
      const responseBody = await response.clone().json();

      addRequest({
        method: "GET",
        url: apiUrl,
        status: response.status,
        duration: 0,
        timestamp: new Date().toISOString(),
        requestBody: null,
        responseBody,
      });

      if (!response.ok) {
        throw new Error(responseBody.error || "Error fetching customers");
      }

      setCustomers(responseBody.customers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching customers");
    } finally {
      setLoading(false);
    }
  }

  async function updateOrder(orderId: string, updates: unknown) {
    setLoading(true);
    setError(null);

    const apiUrl = apiUrls[orderType];

    try {
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, update: updates }),
      });

      const responseBody = await response.clone().json();
      addRequest({
        method: "PUT",
        url: apiUrl,
        status: response.status,
        duration: 0,
        timestamp: new Date().toISOString(),
        requestBody: { id: orderId, update: updates },
        responseBody,
      });

      if (!response.ok) {
        throw new Error(responseBody.error || "Error updating order");
      }

      fetchCustomers(orderType);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating order");
    } finally {
      setLoading(false);
    }
  }

  async function deleteOrder(orderId: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar esta orden?")) {
      return;
    }

    setLoading(true);
    setError(null);

    const apiUrl = apiUrls[orderType];

    try {
      const response = await fetch(`${apiUrl}?id=${orderId}`, { method: "DELETE" });
      const responseBody = await response.clone().json();
      addRequest({
        method: "DELETE",
        url: `${apiUrl}?id=${orderId}`,
        status: response.status,
        duration: 0,
        timestamp: new Date().toISOString(),
        requestBody: null,
        responseBody,
      });

      if (!response.ok) {
        throw new Error(responseBody.error || "Error deleting order");
      }

      fetchCustomers(orderType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting order");
    } finally {
      setLoading(false);
    }
  }

  // Aplica el filtro de pago solo a los pedidos mostrados en cada cliente,
  // sin tocar los totales agregados que vienen del backend.
  const filteredCustomers = useMemo(() => {
    if (paymentFilter === "todos") return customers;

    return customers
      .map((section) => ({
        ...section,
        orders: section.orders.filter((order) => order.paymentStatus === paymentFilter),
      }))
      .filter((section) => section.orders.length > 0);
  }, [customers, paymentFilter]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#fbfaf7] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded border border-[#e2ddd5] bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold mb-6">Acceso admin</h1>

          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="block mb-4 text-sm font-semibold">
            Usuario
            <input
              value={credentials.username}
              onChange={(event) =>
                setCredentials({ ...credentials, username: event.target.value })
              }
              className="mt-2 w-full rounded border border-[#cfc7bd] px-3 py-2 outline-none focus:border-[#d0513f]"
            />
          </label>

          <label className="block mb-6 text-sm font-semibold">
            Contraseña
            <input
              type="password"
              value={credentials.password}
              onChange={(event) =>
                setCredentials({ ...credentials, password: event.target.value })
              }
              className="mt-2 w-full rounded border border-[#cfc7bd] px-3 py-2 outline-none focus:border-[#d0513f]"
            />
          </label>

          <button
            onClick={login}
            disabled={loading}
            className="w-full rounded bg-[#d0513f] px-4 py-3 text-white hover:bg-[#17130f] disabled:opacity-50"
          >
            {loading ? "Autenticando..." : "Entrar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfaf7] p-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Admin Tanna</h1>
          <p className="mt-2 text-sm text-[#6b6259]">
            Pedidos y prendas pedidas, agrupados por cliente.
          </p>
        </div>

        <button
          onClick={() => {
            window.sessionStorage.removeItem("tanna-admin-authenticated");
            setAuthenticated(false);
          }}
          className="rounded border border-[#cfc7bd] bg-white px-4 py-2 text-sm hover:bg-[#f6f3ef]"
        >
          Cerrar sesión
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-2 sm:w-80">
          <button
            onClick={() => switchOrderType("individual")}
            className={`min-h-11 rounded text-sm font-semibold transition ${
              orderType === "individual"
                ? "bg-[#17130f] text-white"
                : "border border-[#cfc7bd] bg-white text-[#17130f] hover:bg-[#f6f3ef]"
            }`}
          >
            Individuales
          </button>
          <button
            onClick={() => switchOrderType("empresa")}
            className={`min-h-11 rounded text-sm font-semibold transition ${
              orderType === "empresa"
                ? "bg-[#17130f] text-white"
                : "border border-[#cfc7bd] bg-white text-[#17130f] hover:bg-[#f6f3ef]"
            }`}
          >
            Empresas
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#6b6259]">Pago:</span>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
            className="rounded border border-[#cfc7bd] bg-white px-3 py-2 text-sm outline-none focus:border-[#d0513f]"
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="pagado">Pagados</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              Clientes {orderType === "empresa" ? "(empresas)" : "(individuales)"}
            </h2>
            <button
              onClick={() => fetchCustomers(orderType)}
              className="rounded bg-[#17130f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d0513f]"
            >
              Actualizar
            </button>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="rounded border border-[#e2ddd5] bg-white p-6 text-sm text-[#6b6259]">
              No hay clientes con pedidos para este filtro.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((section, index) => (
                <AdminCustomerSection
                  key={section.customer.email}
                  section={section}
                  defaultOpen={index === 0}
                  onSelectOrder={(order) => {
                    setSelectedOrder(order);
                    setShowForm(true);
                  }}
                  onDeleteOrder={deleteOrder}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {showForm && selectedOrder ? (
            <AdminOrderForm
              order={selectedOrder}
              onSubmit={updateOrder}
              onClose={() => {
                setShowForm(false);
                setSelectedOrder(null);
              }}
            />
          ) : (
            <div className="rounded border border-[#e2ddd5] bg-white p-6 text-sm text-[#6b6259]">
              Selecciona un pedido para editarlo.
            </div>
          )}

          <AdminRequestMonitor requests={requests} />
        </div>
      </div>
    </div>
  );
}