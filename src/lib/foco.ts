import { useEffect, useRef } from "react";

/**
 * Enquanto o envio está em curso o botão fica desabilitado e o navegador tira
 * o foco dele, que cai no <body>. Se o envio terminar com o formulário ainda
 * na tela e `devolver` verdadeiro (ex.: falha, ou sucesso que mantém o
 * formulário), devolve o foco ao botão; a mensagem continua sendo anunciada
 * pela região role="alert"/"status". Se o foco estiver em outro elemento
 * (ex.: um campo), nada muda.
 */
export function useFocoAposFalha<T extends HTMLElement>(
  enviando: boolean,
  devolver: boolean
) {
  const ref = useRef<T>(null);
  const enviandoAntes = useRef(enviando);

  useEffect(() => {
    const terminou = enviandoAntes.current && !enviando;
    enviandoAntes.current = enviando;
    const semFoco =
      !document.activeElement || document.activeElement === document.body;
    if (terminou && devolver && semFoco) ref.current?.focus();
  }, [enviando, devolver]);

  return ref;
}
