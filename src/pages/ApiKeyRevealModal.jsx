import { useState } from "react";
import { Copy, Check, ShieldAlert } from "lucide-react";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import "./ApiKeyRevealModal.css";

export default function ApiKeyRevealModal({ open, apiKey, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 API를 쓸 수 없는 환경 - 사용자가 직접 드래그해서 복사
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="노드가 등록되었습니다" width={480}>
      <div className="apikey-warning">
        <ShieldAlert size={16} strokeWidth={2} />
        이 창을 닫으면 API 키를 다시 볼 수 없습니다. 지금 복사해서 IoT 담당자에게 전달하세요.
      </div>

      <div className="apikey-box">
        <code>{apiKey}</code>
        <button className="apikey-copy" onClick={handleCopy}>
          {copied ? <Check size={13} strokeWidth={2.4} /> : <Copy size={13} strokeWidth={2.2} />}
          {copied ? "복사됨" : "복사"}
        </button>
      </div>

      <Button onClick={onClose} style={{ width: "100%", marginTop: 18 }}>
        복사했습니다, 닫기
      </Button>
    </Modal>
  );
}
