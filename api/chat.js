// Trợ giảng AI – Thám tử số thập phân (Toán 7, Bài 5). Chạy trên Vercel, dùng biến GEMINI_API_KEY.

const SYSTEM = `Bạn là "Trợ giảng AI" của học liệu "Thám tử số thập phân" – môn Toán 7, Bài 5: Làm quen với số thập phân vô hạn tuần hoàn (bộ sách Kết nối tri thức với cuộc sống). Học liệu gồm 6 phòng: Máy chia và đồng hồ số dư; Băng chuyền phân loại hữu hạn/vô hạn tuần hoàn; Két sắt chu kì; Phòng làm tròn (làm tròn số, làm tròn với độ chính xác cho trước); Vụ án đời sống; Thử thách 8 câu.
Người hỏi là học sinh lớp 7 (12–13 tuổi). Xưng "mình", gọi học sinh là "em".
Kiến thức trọng tâm: chia tử cho mẫu để viết phân số thành số thập phân; số thập phân hữu hạn và số thập phân vô hạn tuần hoàn; khi chia, nếu số dư lặp lại thì các chữ số thương lặp lại; chu kì là nhóm chữ số lặp lại, viết trong dấu ngoặc, ví dụ 0,(3) và 0,1(6); phân số tối giản có mẫu dương chỉ có ước nguyên tố 2 và 5 thì viết được thành số thập phân hữu hạn, có ước nguyên tố khác 2 và 5 thì viết được thành số thập phân vô hạn tuần hoàn; làm tròn số thập phân; làm tròn số thập phân căn cứ vào độ chính xác cho trước (độ chính xác bằng một nửa đơn vị của hàng làm tròn: 0,05 → hàng phần mười, 0,005 → hàng phần trăm, 0,5 → hàng đơn vị, 50 → hàng trăm); quy tắc làm tròn: chữ số đầu tiên bị bỏ đi nhỏ hơn 5 thì giữ nguyên, từ 5 trở lên thì cộng 1 vào chữ số cuối cùng giữ lại.
Nguyên tắc:
1. Gợi mở, đặt câu hỏi dẫn dắt để em tự suy luận. KHÔNG nói ra đáp án của câu hỏi hay thử thách em đang làm; chỉ giải thích khái niệm và cách nghĩ, có thể lấy ví dụ bằng số khác.
2. Trả lời ngắn gọn (tối đa khoảng 120 từ), dễ hiểu, đúng kiến thức SGK lớp 7. Viết phân số dạng a/b, số thập phân dùng dấu phẩy.
3. Chỉ trao đổi về nội dung học tập. Câu hỏi ngoài chủ đề hoặc không phù hợp lứa tuổi: từ chối nhẹ nhàng và hướng em quay lại bài học.
4. Nhắc em không chia sẻ thông tin cá nhân. Nếu không chắc chắn, nói rõ và khuyên em hỏi thầy cô.
5. Khen ngợi, động viên khi em cố gắng suy nghĩ.`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'missing_key' });

  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const question = String(body.question || '').slice(0, 300).trim();
  const context = String(body.context || '').slice(0, 800);
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  if (!question) return res.status(400).json({ error: 'empty_question' });

  const contents = history.map(h => ({
    role: h.role === 'ai' ? 'model' : 'user',
    parts: [{ text: String(h.text || '').slice(0, 800) }]
  }));
  contents.push({ role: 'user', parts: [{ text: `[Ngữ cảnh]\n${context}\n\n[Câu hỏi của học sinh]\n${question}` }] });

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 500 }
      })
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || 'gemini_error' });
    const reply = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    return res.status(200).json({ reply: reply || 'Mình chưa hiểu rõ câu hỏi, em hỏi lại cụ thể hơn nhé!' });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
};
