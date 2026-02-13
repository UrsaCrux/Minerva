import TaskFlowchart from "../../components/TaskFlowchart"

export default function TareasPage() {
    return (
        <div style={{ height: "calc(100vh - 100px)", padding: "0 16px 16px 0" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>
                Flujo de Tareas
            </h1>
            <TaskFlowchart />
        </div>
    )
}
