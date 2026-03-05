import { useParams } from "react-router-dom";

export default function NcmDetailsPage() {
    const params = useParams();
    return (
    <div>
        <h2>Codigo recebido: "{params.codigo}"</h2>
    </div>
    )
}
