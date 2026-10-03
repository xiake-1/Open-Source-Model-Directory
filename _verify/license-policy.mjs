/**
 * 许可 → 商用判定（口径与 docs/项目结构/项目说明.md 的「商用怎么判」一致）。
 * `_verify/generate.mjs` 与 `_verify/generate-batch.mjs` 共用这一份，避免两处判得不一样。
 */
export function commercialOf(license) {
  if (!license) return '有条件可商用';
  if (/CC-BY-NC|NON-COMMERCIAL|非商业|Business Source License|RESEARCH LICENSE|- NC\b/i.test(license)) return '不可商用';
  if (/EXAONE AI Model License 1\.[12]|K-EXAONE/i.test(license)) return '不可商用';
  // 带门槛 / 带使用限制的自定义协议
  if (/(Modified MIT|自定义许可|LICENSE AGREEMENT|Community License|Terms of Use|Solar License|AMLR|Sample Code License|Grok 2 Open Weights|xAI Community License|Llama \d|openPangu|TeleChat|LFM|HAI-DEF|Remix|License$|LICENSE$|协议|条款)/i.test(license)) {
    return '有条件可商用';
  }
  if (/^(Apache-2\.0|MIT|OpenMDW-\d|NVIDIA Open Model License|Falcon LLM License)$/i.test(license)) return '可商用';
  return '有条件可商用';
}