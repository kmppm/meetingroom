"use client";

import { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { StyleRegistry, createStyleRegistry } from "styled-jsx";

// Mengumpulkan semua <style jsx> saat render di server, lalu menyisipkannya
// ke HTML awal. Tanpa ini, CSS komponen baru aktif setelah hydrate, makanya
// halaman sempat tampil berantakan di awal.
export default function StyledJsxRegistry({ children }) {
  const [registry] = useState(() => createStyleRegistry());

  useServerInsertedHTML(() => {
    const styles = registry.styles();
    registry.flush();
    return <>{styles}</>;
  });

  return <StyleRegistry registry={registry}>{children}</StyleRegistry>;
}