// === 工具函数：复制到剪贴板 ===
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            return fallbackCopyTextToClipboard(text);
        }
    } catch (err) {
        console.error('复制失败:', err);
        return false;
    }
}

function fallbackCopyTextToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        return successful;
    } catch (err) {
        document.body.removeChild(textarea);
        console.error('Fallback 复制也失败:', err);
        return false;
    }
}

function showCopyFeedback(success = true) {
    const btn = document.getElementById('copyBtn');
    const originalText = btn.textContent;
    if (success) {
        btn.textContent = '✅ 已复制！';
        btn.style.background = '#27ae60';
    } else {
        btn.textContent = '❌ 复制失败';
        btn.style.background = '#e74c3c';
    }

    setTimeout(() => {
        btn.textContent = '📋 复制脚本';
        btn.style.background = '#27ae60';
    }, 2000);
}

// === 脚本生成逻辑 ===
function generateBaseBlock(id, material) {
    return `val ${id} = GenericBlock.createPillar(<blockmaterial:${material}>, "${id}");\n`;
}

function generateHardnessProps(id, useStrength, hardness, resistance, hardnessOnly) {
    if (useStrength) {
        return `${id}.setStrength(${hardness}, ${resistance}); // 设置硬度与爆炸抗性\n`;
    } else if (hardnessOnly !== undefined) {
        return `${id}.setHardness(${hardnessOnly}); // 设置硬度\n`;
    }
    return '';
}

function generateAdvancedProps(id, harvestLevel, lightLevel, lightOpacity, slipperiness) {
    let lines = [];
    if (harvestLevel && harvestLevel != '0') {
        lines.push(`${id}.setHarvestLevel(${harvestLevel}); // 挖掘等级`);
    }
    if (lightLevel && lightLevel != '0') {
        lines.push(`${id}.setLightLevel(${lightLevel}); // 发光强度 (0-15)`);
    }
    if (lightOpacity && lightOpacity != '0') {
        lines.push(`${id}.setLightOpacity(${lightOpacity}); // 光阻挡程度 (0-255)`);
    }
    if (slipperiness && slipperiness != '0.6') {
        lines.push(`${id}.setSlipperiness(${slipperiness}); // 滑动性 (0-1)`);
    }
    return lines.join('\n') + '\n';
}

function generateScript() {
    const id = document.getElementById('blockId').value.trim();
    const material = document.getElementById('material').value;
    const unbreakable = document.getElementById('unbreakable').checked;
    const useStrength = document.getElementById('useStrength').checked;

    // === 输入校验 ===
    if (!id) {
        alert('❌ 请输入方块 ID');
        return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(id)) {
        alert('❌ 方块 ID 只能包含字母、数字和下划线');
        return;
    }

    let code = generateBaseBlock(id, material);

    // === 硬度相关 ===
    let hardness = parseFloat(document.getElementById('hardnessOnlyInput').value);
    let resistance = parseFloat(document.getElementById('resistance').value);
    let hardnessStrength = parseFloat(document.getElementById('hardnessStrength').value);

    if (useStrength) {
        code += generateHardnessProps(id, true, hardnessStrength, resistance, null);
    } else {
        if (!isNaN(hardness) && hardness > 0) {
            code += generateHardnessProps(id, false, hardness, null, null);
        } else {
            const hardnessOnly = parseFloat(document.getElementById('hardnessOnlyInput').value);
            if (!isNaN(hardnessOnly)) {
                code += generateHardnessProps(id, false, null, null, hardnessOnly);
            }
        }
    }

    if (unbreakable) {
        code += `${id}.setUnbreakable(); // 方块不可破坏\n`;
    }

    // === 高级属性 ===
    const advancedLines = generateAdvancedProps(
        id,
        document.getElementById('harvestLevel').value,
        document.getElementById('lightLevel').value,
        document.getElementById('lightOpacity').value,
        document.getElementById('slipperiness').value
    );
    if (advancedLines) {
        code += advancedLines;
    }

    code += `${id}.register(); // 注册方块\n`;

    // === 输出 ===
    document.getElementById('output').textContent = code;
}

// === 事件监听优化 ===
document.addEventListener('DOMContentLoaded', () => {
    const useStrengthCheckbox = document.getElementById('useStrength');
    const strengthInputs = document.getElementById('strengthInputs');
    const hardnessOnly = document.getElementById('hardnessOnly');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');

    // 强度系统显示逻辑
    useStrengthCheckbox.addEventListener('change', function () {
        const isChecked = this.checked;
        strengthInputs.style.display = isChecked ? 'block' : 'none';
        hardnessOnly.style.display = isChecked ? 'none' : 'block';
    });

    generateBtn.addEventListener('click', generateScript);
    copyBtn.addEventListener('click', async () => {
        const output = document.getElementById('output').textContent;
        if (!output || output === '生成的脚本会显示在这里...') {
            alert('❌ 没有可复制的脚本，请先生成！');
            return;
        }
        const success = await copyToClipboard(output);
        showCopyFeedback(success);
    });
});