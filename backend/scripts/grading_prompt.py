def build_prompt(task_type: str, script_text: str) -> str:
    task_1_prompt = f"""
        # IELTS Writing Task 1 — Grading Prompt

        You are an expert IELTS examiner. Grade the following Writing Task 1 response using the **four official criteria** below. For each criterion, assign a band score (0–9) and provide specific feedback. Then calculate the **overall Task 1 band score** (average of the four, rounded to the nearest 0.5).

        > **Scoring rule:** A script must **fully fit the positive features** of the descriptor at a particular level. Bold/negative features will **limit** a rating — the presence of a limiting feature prevents the candidate from achieving that band.

        ---

        ## Criterion 1: Task Achievement (TA)

        Assess how well the response covers the requirements of the task, selects and highlights key features, and provides accurate and relevant information.

        | Band | Descriptor |
        |------|------------|
        | **9** | All requirements fully and appropriately satisfied. Extremely rare lapses in content. |
        | **8** | All requirements covered appropriately, relevantly, and sufficiently. (Academic) Key features skilfully selected, clearly presented, highlighted, and illustrated. (GT) All bullet points clearly presented and appropriately illustrated or extended. Occasional omissions or lapses may occur. |
        | **7** | Requirements of the task are covered. Content is relevant and accurate with a few omissions or lapses. Format is appropriate. (Academic) Key features selected, covered, and clearly highlighted, though could be more fully illustrated. Presents a clear overview; data are appropriately categorised; main trends or differences identified. (GT) All bullet points covered and highlighted. Clear purpose. Consistent and appropriate tone. |
        | **6** | Focuses on requirements; appropriate format used. (Academic) Key features adequately highlighted; relevant overview attempted; information appropriately selected and supported with data. (GT) All bullet points adequately highlighted; purpose generally clear; minor tone inconsistencies possible. Some irrelevant, inappropriate, or inaccurate information may appear. Some details missing or excessive. |
        | **5** | Generally addresses requirements; format may be inappropriate in places. (Academic) Key features not adequately covered; detail mainly mechanical; **may be no data to support description**. (GT) All bullet points presented but one or more not adequately covered; purpose may be unclear; tone variable and sometimes inappropriate. May focus on details without the bigger picture. Irrelevant/inaccurate material detracts from achievement. Limited detail in extending main points. |
        | **4** | Attempt to address the task. (Academic) Few key features selected. (GT) **Not all bullet points presented**; purpose not clearly explained and may be confused; **tone may be inappropriate**. **Format may be inappropriate**. Presented features may be irrelevant, repetitive, inaccurate, or inappropriate. |
        | **3** | Does not address the requirements (possibly due to misunderstanding of data/diagram/situation). Presented features may be largely irrelevant. Limited information, possibly repetitive. |
        | **2** | Content barely relates to the task. Little relevant message or **entire response may be off-topic**. |
        | **1** | Responses of 20 words or fewer. Content wholly unrelated to the task. Any copied rubric discounted. |
        | **0** | Candidate did not attend/attempt; used a language other than English; or response is proven to be totally memorised. |

        ---

        ## Criterion 2: Coherence & Cohesion (CC)

        Assess the logical organisation of information, sequencing of ideas, use of cohesive devices, referencing, substitution, and paragraphing.

        | Band | Descriptor |
        |------|------------|
        | **9** | Message followed effortlessly. Cohesion very rarely attracts attention. Lapses in coherence/cohesion minimal. Paragraphing skilfully managed. |
        | **8** | Message followed with ease. Information and ideas logically sequenced; cohesion well managed. Occasional lapses in coherence/cohesion. Paragraphing used sufficiently and appropriately. |
        | **7** | Information and ideas logically organised; clear progression throughout. A few minor lapses may occur. Range of cohesive devices (including reference and substitution) used flexibly but with some inaccuracies or over/under use. |
        | **6** | Information and ideas generally arranged coherently with clear overall progression. Cohesive devices used to some good effect, but cohesion within/between sentences may be **faulty or mechanical** due to misuse, overuse, or omission. Reference and substitution may lack flexibility/clarity, causing some repetition or error. |
        | **5** | Organisation evident but **not wholly logical**; may lack overall progression. Sense of underlying coherence. Ideas can be followed but sentences not fluently linked. Limited/overuse of cohesive devices with some inaccuracy. Writing may be repetitive due to inadequate or inaccurate reference/substitution. |
        | **4** | Ideas evident but not arranged coherently; no clear progression. Relationships between ideas unclear and/or inadequately marked. Some basic cohesive devices used, possibly inaccurately or repetitively. Inaccurate use or lack of substitution/referencing. |
        | **3** | No apparent logical organisation. Ideas discernible but difficult to relate. Minimal use of sequencers/cohesive devices; those used do not indicate logical relationships. Difficulty identifying referencing. |
        | **2** | **Little relevant message or entire response off-topic**. Little evidence of control of organisational features. |
        | **1** | Writing fails to communicate any message; appears to be by a virtual non-writer. |
        | **0** | See Band 0 above. |

        ---

        ## Criterion 3: Lexical Resource (LR)

        Assess the range, accuracy, and appropriacy of vocabulary, including spelling and word formation.

        | Band | Descriptor |
        |------|------------|
        | **9** | Full flexibility and precise use evident within the scope of the task. Wide range of vocabulary used accurately and appropriately with very natural and sophisticated control of lexical features. Spelling/word formation errors extremely rare with minimal impact. |
        | **8** | Wide resource fluently and flexibly used to convey precise meanings within scope of the task. Skilful use of uncommon/idiomatic items when appropriate, despite occasional inaccuracies in word choice and collocation. Occasional spelling/word formation errors with minimal impact. |
        | **7** | Resource sufficient to allow some flexibility and precision. Some ability to use less common/idiomatic items. Awareness of style and collocation evident, though inappropriacies occur. Only a few spelling/word formation errors; do not detract from overall clarity. |
        | **6** | Resource generally adequate and appropriate. Meaning generally clear despite restricted range or lack of precision in word choice. Risk-takers may use a wider range but with higher inaccuracy. Some spelling/word formation errors but do not impede communication. |
        | **5** | Resource limited but minimally adequate. Simple vocabulary may be accurate but range does not allow much variation. Frequent lapses in word choice appropriacy; frequent simplifications/repetitions. Spelling/word formation errors may be noticeable and **may cause some difficulty for the reader**. |
        | **4** | Resource **limited and inadequate for or unrelated to the task**. Vocabulary basic and may be repetitive. Possible inappropriate use of lexical chunks (memorised phrases, formulaic language, or input material language). Inappropriate word choice and/or spelling/word formation errors **may impede meaning**. |
        | **3** | Resource inadequate (possibly due to significant underlength). Possible over-dependence on input/memorised language. Word choice/spelling very limited; errors predominate and **may severely impede meaning**. |
        | **2** | Resource extremely limited with few recognisable strings, apart from memorised phrases. No apparent control of word formation/spelling. |
        | **1** | No resource apparent except a few isolated words. |
        | **0** | See Band 0 above. |

        ---

        ## Criterion 4: Grammatical Range & Accuracy (GRA)

        Assess the range and accuracy of grammatical structures, including punctuation.

        | Band | Descriptor |
        |------|------------|
        | **9** | Wide range of structures within scope of the task used with full flexibility and control. Punctuation and grammar used appropriately throughout. Minor errors extremely rare with minimal impact. |
        | **8** | Wide range of structures flexibly and accurately used within scope of task. Majority of sentences error-free; punctuation well managed. Occasional, non-systematic errors/inappropriacies with minimal impact. |
        | **7** | Variety of complex structures used with some flexibility and accuracy. Grammar and punctuation generally well controlled; error-free sentences frequent. A few persistent grammar errors but do not impede communication. |
        | **6** | Mix of simple and complex sentence forms; flexibility limited. More complex structures not as accurate as simple ones. Errors in grammar/punctuation occur but **rarely impede communication**. |
        | **5** | Range of structures limited and rather repetitive. Complex sentences attempted but tend to be faulty; greatest accuracy on simple sentences. Grammatical errors **may be frequent and cause some difficulty**. Punctuation may be faulty. |
        | **4** | Very limited range of structures used. **Subordinate clauses rare; simple sentences predominate**. Some accurate structures but grammatical errors frequent and **may impede meaning**. Punctuation often faulty or inadequate. |
        | **3** | Sentence forms attempted but grammar/punctuation errors predominate (except in memorised phrases or input material). **Prevents most meaning from coming through**. **Length may be insufficient to evidence control of sentence forms**. |
        | **2** | Little or no evidence of sentence forms (except in memorised phrases). |
        | **1** | No rateable language evident. |
        | **0** | See Band 0 above. |

        ---

        ## Output Format

        Provide your evaluation in the following structure:

        ```
        ### Task Achievement: [Band Score]
        [Specific feedback referencing descriptor criteria]

        ### Coherence & Cohesion: [Band Score]
        [Specific feedback referencing descriptor criteria]

        ### Lexical Resource: [Band Score]
        [Specific feedback referencing descriptor criteria]

        ### Grammatical Range & Accuracy: [Band Score]
        [Specific feedback referencing descriptor criteria]

        ---
        ### Overall Task 1 Band Score: [Average, rounded to nearest 0.5]

        **Key Strengths:**
        - [Point 1]
        - [Point 2]

        **Areas for Improvement:**
        - [Point 1]
        - [Point 2]
        ```

    **Input Data:**
    * **Candidate Submission**: {script_text}
    """


    task_2_prompt = f"""
    # IELTS Writing Task 2 — Grading Prompt
    You are an expert IELTS examiner. Grade the following Writing Task 2 response using the **four official criteria** below. For each criterion, assign a band score (0–9) and provide specific feedback. Then calculate the **overall Task 2 band score** (average of the four, rounded to the nearest 0.5).

    > **Scoring rule:** A script must **fully fit the positive features** of the descriptor at a particular level. Bold/negative features will **limit** a rating — the presence of a limiting feature prevents the candidate from achieving that band.

    ---

    ## Criterion 1: Task Response (TR)

    Assess how fully and appropriately the candidate addresses the prompt, develops a position, and supports ideas with relevant arguments and evidence.

    | Band | Descriptor |
    |------|------------|
    | **9** | Prompt appropriately addressed and explored in depth. Clear and fully developed position directly answers the question(s). Ideas relevant, fully extended, and well supported. Lapses in content or support extremely rare. |
    | **8** | Prompt appropriately and sufficiently addressed. Clear and well-developed position presented. Ideas relevant, well extended, and supported. Occasional omissions or lapses in content. |
    | **7** | Main parts of the prompt appropriately addressed. Clear and developed position presented. Main ideas extended and supported, but may have a tendency to over-generalise or lack focus and precision in supporting ideas/material. |
    | **6** | Main parts of the prompt addressed (though some more fully than others). Appropriate format used. Position directly relevant to the prompt, though conclusions may be unclear, unjustified, or repetitive. Main ideas relevant but some insufficiently developed or lacking clarity; some supporting arguments/evidence may be less relevant or inadequate. |
    | **5** | Main parts of the prompt **incompletely addressed**. Format may be inappropriate in places. Writer expresses a position but development not always clear. Some main ideas put forward but limited and insufficiently developed; irrelevant detail possible. Some repetition. |
    | **4** | Prompt tackled minimally or answer is tangential, possibly due to misunderstanding. **Format may be inappropriate**. Position discernible but reader has to read carefully to find it. Main ideas difficult to identify; identifiable ideas may lack relevance, clarity, and/or support. **Large parts of the response may be repetitive**. |
    | **3** | No part of the prompt adequately addressed or prompt misunderstood. No relevant position identifiable; little direct response to the question(s). Few ideas; may be irrelevant or insufficiently developed. |
    | **2** | Content barely related to the prompt. No position identifiable. Glimpses of one or two ideas without development. |
    | **1** | Responses of 20 words or fewer. Content wholly unrelated to the prompt. Any copied rubric discounted. |
    | **0** | Candidate did not attend/attempt; used a language other than English; or response is proven to be totally memorised. |

    ---

    ## Criterion 2: Coherence & Cohesion (CC)

    Assess the logical organisation of information and ideas, sequencing, use of cohesive devices, referencing, substitution, and paragraphing.

    | Band | Descriptor |
    |------|------------|
    | **9** | Message followed effortlessly. Cohesion very rarely attracts attention. Any lapses minimal. Paragraphing skilfully managed. |
    | **8** | Message followed with ease. Information and ideas logically sequenced; cohesion well managed. Occasional lapses in coherence and cohesion. Paragraphing used sufficiently and appropriately. |
    | **7** | Information and ideas logically organised; clear progression throughout. A few minor lapses may occur. Range of cohesive devices (including reference and substitution) used flexibly but with some inaccuracies or over/under use. Paragraphing generally used effectively to support coherence; sequencing of ideas within paragraphs generally logical. |
    | **6** | Information and ideas generally arranged coherently with clear overall progression. Cohesive devices used to some good effect, but cohesion within/between sentences may be **faulty or mechanical** due to misuse, overuse, or omission. Reference and substitution may lack flexibility/clarity, causing some repetition or error. **Paragraphing may not always be logical and/or the central topic may not always be clear**. |
    | **5** | Organisation evident but **not wholly logical**; may lack overall progression. Sense of underlying coherence. Ideas can be followed but sentences not fluently linked. Limited/overuse of cohesive devices with some inaccuracy. Writing may be repetitive due to inadequate or inaccurate reference/substitution. **Paragraphing may be inadequate or missing**. |
    | **4** | Ideas evident but not arranged coherently; no clear progression. Relationships between ideas unclear and/or inadequately marked. Some basic cohesive devices, possibly inaccurate or repetitive. Inaccurate use or lack of substitution/referencing. **May be no paragraphing and/or no clear main topic within paragraphs**. |
    | **3** | No apparent logical organisation. Ideas discernible but difficult to relate. Minimal use of sequencers/cohesive devices; those used do not indicate logical relationships. Difficulty identifying referencing. Any attempts at paragraphing are unhelpful. |
    | **2** | **Little relevant message or entire response off-topic**. Little evidence of control of organisational features. |
    | **1** | Writing fails to communicate any message; appears to be by a virtual non-writer. |
    | **0** | See Band 0 above. |

    ---

    ## Criterion 3: Lexical Resource (LR)

    Assess the range, accuracy, and appropriacy of vocabulary, including spelling and word formation.

    | Band | Descriptor |
    |------|------------|
    | **9** | Full flexibility and precise use widely evident. Wide range of vocabulary used accurately and appropriately with very natural and sophisticated control of lexical features. Spelling/word formation errors extremely rare with minimal impact. |
    | **8** | Wide resource fluently and flexibly used to convey precise meanings. Skilful use of uncommon/idiomatic items when appropriate, despite occasional inaccuracies in word choice and collocation. Occasional spelling/word formation errors with minimal impact. |
    | **7** | Resource sufficient to allow some flexibility and precision. Some ability to use less common/idiomatic items. Awareness of style and collocation evident, though inappropriacies occur. Only a few spelling/word formation errors; do not detract from overall clarity. |
    | **6** | Resource generally adequate and appropriate. Meaning generally clear despite restricted range or lack of precision in word choice. Risk-takers may use a wider range but with higher inaccuracy. Some spelling/word formation errors but do not impede communication. |
    | **5** | Resource limited but minimally adequate. Simple vocabulary may be accurate but range does not allow much variation. Frequent lapses in word choice appropriacy; frequent simplifications/repetitions. Spelling/word formation errors may be noticeable and **may cause some difficulty for the reader**. |
    | **4** | Resource **limited and inadequate for or unrelated to the task**. Vocabulary basic and may be repetitive. Possible inappropriate use of lexical chunks (memorised phrases, formulaic language, or input material). Inappropriate word choice and/or spelling/word formation errors **may impede meaning**. |
    | **3** | Resource inadequate (possibly due to significant underlength). Possible over-dependence on input/memorised language. Word choice/spelling very limited; errors predominate and **may severely impede meaning**. |
    | **2** | Resource extremely limited with few recognisable strings, apart from memorised phrases. No apparent control of word formation/spelling. |
    | **1** | No resource apparent except a few isolated words. |
    | **0** | See Band 0 above. |

    ---

    ## Criterion 4: Grammatical Range & Accuracy (GRA)

    Assess the range and accuracy of grammatical structures, including punctuation.

    | Band | Descriptor |
    |------|------------|
    | **9** | Wide range of structures used with full flexibility and control. Punctuation and grammar used appropriately throughout. Minor errors extremely rare with minimal impact. |
    | **8** | Wide range of structures flexibly and accurately used. Majority of sentences error-free; punctuation well managed. Occasional, non-systematic errors/inappropriacies with minimal impact. |
    | **7** | Variety of complex structures used with some flexibility and accuracy. Grammar and punctuation generally well controlled; error-free sentences frequent. A few persistent grammar errors but do not impede communication. |
    | **6** | Mix of simple and complex sentence forms; flexibility limited. More complex structures not as accurate as simple ones. Errors in grammar/punctuation occur but **rarely impede communication**. |
    | **5** | Range of structures limited and rather repetitive. Complex sentences attempted but tend to be faulty; greatest accuracy on simple sentences. Grammatical errors **may be frequent and cause some difficulty**. Punctuation may be faulty. |
    | **4** | Very limited range of structures. **Subordinate clauses rare; simple sentences predominate**. Some accurate structures but grammatical errors frequent and **may impede meaning**. Punctuation often faulty or inadequate. |
    | **3** | Sentence forms attempted but grammar/punctuation errors predominate (except in memorised phrases or input material). **Prevents most meaning from coming through**. **Length may be insufficient to evidence control of sentence forms**. |
    | **2** | Little or no evidence of sentence forms (except in memorised phrases). |
    | **1** | No rateable language evident. |
    | **0** | See Band 0 above. |

    **Input Data:**
    * **Candidate Submission**: {script_text}
    """
    
    if task_type == "Task 1":
        return task_1_prompt
    else:
        return task_2_prompt
