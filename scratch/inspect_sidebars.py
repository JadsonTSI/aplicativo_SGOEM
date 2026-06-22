import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

pattern_file = r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\professores\templates\professores\professores_home.html"
files = [
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\grupos\templates\grupos\detalhes.html",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\grupos\templates\grupos\enviar_partitura.html",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\grupos\templates\grupos\lista.html",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\materias\templates\materias\professor_editar_link.html",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\materias\templates\materias\professor_lista.html",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\professores\templates\professores\apresentacoes_form.html",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\professores\templates\professores\apresentacoes_list.html",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\professores\templates\professores\ensaios_confirm_delete.html",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\professores\templates\professores\ensaios_list.html",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\professores\templates\professores\ensaios_pro.html",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\professores\templates\professores\naipe_detalhe.html",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\professores\templates\professores\naipes.html",
]

def clean_nav(nav_str):
    nav_str = nav_str.replace("active", "").replace('class="sidebar-link "', 'class="sidebar-link"')
    lines = [l.strip() for l in nav_str.split("\n") if l.strip()]
    return lines

with open(pattern_file, "r", encoding="utf-8") as f:
    pattern_content = f.read()

pattern_aside_match = re.search(r'(<aside class="sidebar".*?</aside>)', pattern_content, re.DOTALL)
pattern_aside = pattern_aside_match.group(1)
pattern_nav_match = re.search(r'(<nav class="sidebar-nav">.*?</nav>)', pattern_content, re.DOTALL)
pattern_nav_lines = clean_nav(pattern_nav_match.group(1))

all_ok = True

for f in files:
    if not os.path.exists(f):
        print(f"{os.path.basename(f)}: NOT FOUND")
        all_ok = False
        continue
    with open(f, "r", encoding="utf-8") as file:
        content = file.read()
    
    aside_match = re.search(r'(<aside class="sidebar".*?</aside>)', content, re.DOTALL)
    if not aside_match:
        print(f"{os.path.basename(f)}: No sidebar element found")
        all_ok = False
        continue
        
    aside = aside_match.group(1)
    nav_match = re.search(r'(<nav class="sidebar-nav">.*?</nav>)', aside, re.DOTALL)
    if not nav_match:
        print(f"{os.path.basename(f)}: No nav element found")
        all_ok = False
        continue
        
    nav_lines = clean_nav(nav_match.group(1))
    
    diffs = []
    import difflib
    diff = list(difflib.unified_diff(pattern_nav_lines, nav_lines, lineterm=""))
    changes = [line for line in diff if line.startswith('+') or line.startswith('-')]
    if len(changes) > 2:
        diffs = changes[2:]
        
    # Check deco symbol
    pattern_deco = re.search(r'class="sidebar-deco".*?>(.*?)</div>', pattern_aside).group(1)
    f_deco_match = re.search(r'class="sidebar-deco".*?>(.*?)</div>', aside)
    f_deco = f_deco_match.group(1) if f_deco_match else "None"
    
    deco_diff = ""
    if pattern_deco != f_deco:
        deco_diff = f"Deco symbol mismatch: Pattern '{pattern_deco}' vs File '{f_deco}'"
        
    brand_diff = ""
    if "Painel do Professor" not in aside:
        brand_diff = "Brand text mismatch (doesn't contain 'Painel do Professor')"
        
    if not diffs and not deco_diff and not brand_diff:
        # print(f"{os.path.basename(f)}: OK")
        pass
    else:
        all_ok = False
        print(f"{os.path.basename(f)}: HAS DIFFERENCES")
        if deco_diff:
            print(f"  - {deco_diff}")
        if brand_diff:
            print(f"  - {brand_diff}")
        if diffs:
            print("  - Nav differences:")
            for d in diffs:
                print(f"    {d}")

# Now check perfil.html
perfil_path = r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\contas\templates\contas\perfil.html"
if os.path.exists(perfil_path):
    with open(perfil_path, "r", encoding="utf-8") as file:
        content = file.read()
    
    # Extract the aside sidebar
    aside_match = re.search(r'(<aside class="sidebar".*?</aside>)', content, re.DOTALL)
    if aside_match:
        aside = aside_match.group(1)
        print(f"DEBUG: Captured aside length = {len(aside)}")
        print(f"DEBUG: First 500 chars of aside:\n{aside[:500]}")
        print(f"DEBUG: Last 200 chars of aside:\n{aside[-200:]}")
        # Find the professor block specifically in the nav element of aside
        nav_match = re.search(r'(<nav class="sidebar-nav">.*?</nav>)', aside, re.DOTALL)
        if nav_match:
            nav_content = nav_match.group(1)
            prof_block_match = re.search(r'{%\s*elif\s+perfil\.tipo\s*==\s*\'professor\'\s*%}(.*?){%\s*else\s*%}', nav_content, re.DOTALL)
            if prof_block_match:
                prof_block = prof_block_match.group(1)
                # Check if "Meu Ensino" label is present
                if "Meu Ensino" not in prof_block:
                    print("perfil.html (Professor section): Missing 'Meu Ensino' label!")
                    all_ok = False
                else:
                    print("perfil.html (Professor section): 'Meu Ensino' label IS PRESENT")
                    
                # Check the Apresentacoes icon inside the professor block
                icon_match = re.search(r'href="{% url \'professores:apresentacoes_list\' %}".*?class="sidebar-link".*?<i class="(.*?)">', prof_block, re.DOTALL)
                if icon_match:
                    icon_class = icon_match.group(1)
                    if icon_class != "bi bi-grid-3x3-gap-fill":
                        print(f"perfil.html (Professor section): Icon mismatch for Apresentações: '{icon_class}' instead of 'bi bi-grid-3x3-gap-fill'")
                        all_ok = False
                    else:
                        print("perfil.html (Professor section): Apresentações icon IS CORRECT (bi bi-grid-3x3-gap-fill)")
                else:
                    print("perfil.html (Professor section): Apresentações link icon not found!")
                    all_ok = False
            else:
                print("perfil.html (Professor section): Professor conditional block not found inside <nav>!")
                all_ok = False
        else:
            print("perfil.html: nav element not found inside aside!")
            all_ok = False
    else:
        print("perfil.html: aside element not found!")
        all_ok = False
else:
    print(f"perfil.html: NOT FOUND at {perfil_path}")
    all_ok = False

if all_ok:
    print("\n>>> ALL SIDEBARS VERIFIED AND FULLY STANDARDIZED! <<<")
else:
    print("\n>>> VERIFICATION FAILED! SOME SIDEBARS STILL DIFFER. <<<")
